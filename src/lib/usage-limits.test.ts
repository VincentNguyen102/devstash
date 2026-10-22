import { describe, expect, it } from "vitest";

import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_ONLY_TYPE_IDS,
  checkCollectionLimit,
  checkItemCreation,
  checkItemLimit,
  checkItemType,
  isProOnlyTypeId,
  type LimitCheck,
} from "@/lib/usage-limits";

/** Asserts a denied result and returns its user-facing message. */
function expectDenied(result: LimitCheck): string {
  expect(result.allowed).toBe(false);

  if (result.allowed) {
    throw new Error("Expected the check to be denied.");
  }

  return result.error;
}

describe("usage limit constants", () => {
  it("sets the Free tier limits", () => {
    expect(FREE_ITEM_LIMIT).toBe(50);
    expect(FREE_COLLECTION_LIMIT).toBe(3);
  });

  it("marks file and image as Pro-only", () => {
    expect(PRO_ONLY_TYPE_IDS).toEqual(["file", "image"]);
  });
});

describe("isProOnlyTypeId", () => {
  it("returns true for file and image", () => {
    expect(isProOnlyTypeId("file")).toBe(true);
    expect(isProOnlyTypeId("image")).toBe(true);
  });

  it("returns false for Free item types", () => {
    expect(isProOnlyTypeId("snippet")).toBe(false);
    expect(isProOnlyTypeId("prompt")).toBe(false);
    expect(isProOnlyTypeId("command")).toBe(false);
    expect(isProOnlyTypeId("note")).toBe(false);
    expect(isProOnlyTypeId("url")).toBe(false);
  });

  it("returns false for custom and empty ids", () => {
    expect(isProOnlyTypeId("my-custom-type")).toBe(false);
    expect(isProOnlyTypeId("")).toBe(false);
  });
});

describe("checkItemLimit", () => {
  it("allows a Free user under the limit", () => {
    expect(checkItemLimit({ isPro: false, itemCount: 0 })).toEqual({
      allowed: true,
    });
    expect(checkItemLimit({ isPro: false, itemCount: 49 })).toEqual({
      allowed: true,
    });
  });

  it("blocks a Free user at and above the limit", () => {
    const atLimit = expectDenied(
      checkItemLimit({ isPro: false, itemCount: FREE_ITEM_LIMIT }),
    );
    const aboveLimit = expectDenied(
      checkItemLimit({ isPro: false, itemCount: FREE_ITEM_LIMIT + 1 }),
    );

    expect(atLimit).toContain(String(FREE_ITEM_LIMIT));
    expect(aboveLimit).toContain(String(FREE_ITEM_LIMIT));
  });

  it("allows Pro users at any count", () => {
    expect(checkItemLimit({ isPro: true, itemCount: 0 })).toEqual({
      allowed: true,
    });
    expect(
      checkItemLimit({ isPro: true, itemCount: FREE_ITEM_LIMIT }),
    ).toEqual({ allowed: true });
    expect(checkItemLimit({ isPro: true, itemCount: 10_000 })).toEqual({
      allowed: true,
    });
  });
});

describe("checkCollectionLimit", () => {
  it("allows a Free user under the limit", () => {
    expect(checkCollectionLimit({ isPro: false, collectionCount: 0 })).toEqual({
      allowed: true,
    });
    expect(checkCollectionLimit({ isPro: false, collectionCount: 2 })).toEqual({
      allowed: true,
    });
  });

  it("blocks a Free user at and above the limit", () => {
    const atLimit = expectDenied(
      checkCollectionLimit({
        isPro: false,
        collectionCount: FREE_COLLECTION_LIMIT,
      }),
    );
    const aboveLimit = expectDenied(
      checkCollectionLimit({
        isPro: false,
        collectionCount: FREE_COLLECTION_LIMIT + 1,
      }),
    );

    expect(atLimit).toContain(String(FREE_COLLECTION_LIMIT));
    expect(aboveLimit).toContain(String(FREE_COLLECTION_LIMIT));
  });

  it("allows Pro users at any count", () => {
    expect(checkCollectionLimit({ isPro: true, collectionCount: 3 })).toEqual({
      allowed: true,
    });
    expect(checkCollectionLimit({ isPro: true, collectionCount: 10 })).toEqual({
      allowed: true,
    });
  });
});

describe("checkItemType", () => {
  it("allows Free users to create text and link items", () => {
    for (const typeId of ["snippet", "prompt", "command", "note", "url"]) {
      expect(checkItemType(typeId, false)).toEqual({ allowed: true });
    }
  });

  it("blocks Free users from creating file and image items", () => {
    const file = expectDenied(checkItemType("file", false));
    const image = expectDenied(checkItemType("image", false));

    expect(file).toMatch(/Pro feature/);
    expect(image).toMatch(/Pro feature/);
  });

  it("allows Pro users to create file and image items", () => {
    expect(checkItemType("file", true)).toEqual({ allowed: true });
    expect(checkItemType("image", true)).toEqual({ allowed: true });
  });

  it("allows unknown/custom ids (custom-type gating is separate)", () => {
    expect(checkItemType("my-custom-type", false)).toEqual({ allowed: true });
  });
});

describe("checkItemCreation", () => {
  it("returns the Pro-type error first", () => {
    const atZero = expectDenied(
      checkItemCreation("file", {
        isPro: false,
        itemCount: 0,
        collectionCount: 0,
      }),
    );
    const atLimit = expectDenied(
      checkItemCreation("file", {
        isPro: false,
        itemCount: FREE_ITEM_LIMIT,
        collectionCount: 0,
      }),
    );

    expect(atZero).toMatch(/Pro feature/);
    expect(atLimit).toMatch(/Pro feature/);
  });

  it("allows a Free snippet under the item limit", () => {
    expect(
      checkItemCreation("snippet", {
        isPro: false,
        itemCount: 49,
        collectionCount: 0,
      }),
    ).toEqual({ allowed: true });
  });

  it("blocks a Free snippet at the item limit", () => {
    const error = expectDenied(
      checkItemCreation("snippet", {
        isPro: false,
        itemCount: FREE_ITEM_LIMIT,
        collectionCount: 0,
      }),
    );

    expect(error).toContain(String(FREE_ITEM_LIMIT));
  });

  it("allows Pro users at any count, including Pro-only types", () => {
    expect(
      checkItemCreation("file", {
        isPro: true,
        itemCount: FREE_ITEM_LIMIT,
        collectionCount: 0,
      }),
    ).toEqual({ allowed: true });
    expect(
      checkItemCreation("snippet", {
        isPro: true,
        itemCount: 10_000,
        collectionCount: 0,
      }),
    ).toEqual({ allowed: true });
  });
});
