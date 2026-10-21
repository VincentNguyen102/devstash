import { describe, expect, it } from "vitest";

import type { FavoriteCollectionSummary } from "@/lib/db/collections";
import type { ItemSummary } from "@/lib/db/items";
import {
  isFavoriteSort,
  sortFavoriteCollections,
  sortFavoriteItems,
} from "@/lib/favorites-sort";

function item(
  overrides: Partial<ItemSummary> & Pick<ItemSummary, "id" | "title" | "typeId">,
): ItemSummary {
  return {
    description: "",
    isFavorite: true,
    isPinned: false,
    tags: [],
    content: null,
    url: null,
    fileName: null,
    fileSize: null,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function collection(
  overrides: Partial<FavoriteCollectionSummary> &
    Pick<FavoriteCollectionSummary, "id" | "name">,
): FavoriteCollectionSummary {
  return {
    description: "",
    isFavorite: true,
    itemCount: 1,
    typeIds: [],
    dominantTypeId: null,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const items = [
  item({
    id: "1",
    title: "Git Operations",
    typeId: "command",
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  }),
  item({
    id: "2",
    title: "Code Review Prompt",
    typeId: "prompt",
    updatedAt: new Date("2026-01-04T00:00:00Z"),
  }),
  item({
    id: "3",
    title: "Custom React Hooks",
    typeId: "snippet",
    updatedAt: new Date("2026-01-03T00:00:00Z"),
  }),
  item({
    id: "4",
    title: "shadcn/ui",
    typeId: "url",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  }),
];

const collections = [
  collection({
    id: "a",
    name: "Terminal Commands",
    dominantTypeId: "command",
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  }),
  collection({
    id: "b",
    name: "Design Resources",
    dominantTypeId: "url",
    updatedAt: new Date("2026-01-04T00:00:00Z"),
  }),
  collection({
    id: "c",
    name: "Empty Collection",
    dominantTypeId: null,
    updatedAt: new Date("2026-01-03T00:00:00Z"),
  }),
];

describe("isFavoriteSort", () => {
  it("accepts the known sort values", () => {
    expect(isFavoriteSort("date")).toBe(true);
    expect(isFavoriteSort("name")).toBe(true);
    expect(isFavoriteSort("type")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isFavoriteSort("created")).toBe(false);
    expect(isFavoriteSort("")).toBe(false);
  });
});

describe("sortFavoriteItems", () => {
  it("sorts by name A–Z", () => {
    expect(sortFavoriteItems(items, "name").map((entry) => entry.title)).toEqual(
      [
        "Code Review Prompt",
        "Custom React Hooks",
        "Git Operations",
        "shadcn/ui",
      ],
    );
  });

  it("sorts by date, newest first", () => {
    expect(sortFavoriteItems(items, "date").map((entry) => entry.id)).toEqual([
      "2",
      "3",
      "1",
      "4",
    ]);
  });

  it("groups by canonical type order", () => {
    expect(sortFavoriteItems(items, "type").map((entry) => entry.typeId)).toEqual(
      ["snippet", "prompt", "command", "url"],
    );
  });

  it("does not mutate the incoming array", () => {
    const original = [...items];

    sortFavoriteItems(items, "name");

    expect(items).toEqual(original);
  });
});

describe("sortFavoriteCollections", () => {
  it("sorts by name A–Z", () => {
    expect(
      sortFavoriteCollections(collections, "name").map((entry) => entry.name),
    ).toEqual(["Design Resources", "Empty Collection", "Terminal Commands"]);
  });

  it("sorts by date, newest first", () => {
    expect(
      sortFavoriteCollections(collections, "date").map((entry) => entry.id),
    ).toEqual(["b", "c", "a"]);
  });

  it("groups by dominant type and puts empty collections last", () => {
    expect(
      sortFavoriteCollections(collections, "type").map((entry) => entry.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the incoming array", () => {
    const original = [...collections];

    sortFavoriteCollections(collections, "name");

    expect(collections).toEqual(original);
  });
});
