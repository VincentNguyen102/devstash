import { describe, expect, it } from "vitest";

import {
  AUTO_TAG_CONTENT_LIMIT,
  AUTO_TAG_MAX_TAGS,
  DESCRIPTION_CONTENT_LIMIT,
  DESCRIPTION_MAX_LENGTH,
  EXPLAIN_CONTENT_LIMIT,
  buildAutoTagInput,
  buildDescriptionInput,
  buildExplainInput,
  normalizeDescription,
  parseAutoTagResponse,
  parseDescriptionResponse,
  parseExplainResponse,
  truncateForAutoTags,
  truncateForDescription,
  truncateForExplain,
} from "@/lib/ai";

describe("truncateForAutoTags", () => {
  it("keeps content shorter than the limit untouched", () => {
    expect(truncateForAutoTags("short content")).toBe("short content");
  });

  it("cuts content at the configured limit", () => {
    const content = "a".repeat(AUTO_TAG_CONTENT_LIMIT + 50);

    expect(truncateForAutoTags(content)).toHaveLength(AUTO_TAG_CONTENT_LIMIT);
  });
});

describe("buildAutoTagInput", () => {
  it("includes the trimmed title and the content", () => {
    const input = buildAutoTagInput("  My snippet  ", "const x = 1;");

    expect(input).toContain("Title:\nMy snippet");
    expect(input).toContain("Content:\nconst x = 1;");
  });

  it("truncates long content before it is sent", () => {
    const input = buildAutoTagInput("Title", "a".repeat(5_000));

    expect(input).toContain("a".repeat(AUTO_TAG_CONTENT_LIMIT));
    expect(input).not.toContain("a".repeat(AUTO_TAG_CONTENT_LIMIT + 1));
  });

  it("mentions JSON in the input for json_object mode", () => {
    expect(buildAutoTagInput("Title", "content")).toMatch(/json/i);
  });
});

describe("parseAutoTagResponse", () => {
  it("parses the object shape", () => {
    expect(parseAutoTagResponse('{"tags":["React","Hooks"]}')).toEqual([
      "react",
      "hooks",
    ]);
  });

  it("parses a bare array", () => {
    expect(parseAutoTagResponse('["TypeScript","testing"]')).toEqual([
      "typescript",
      "testing",
    ]);
  });

  it("normalizes whitespace, casing and leading hashes", () => {
    expect(
      parseAutoTagResponse('{"tags":["  #React  ","  State Management "]}'),
    ).toEqual(["react", "state management"]);
  });

  it("removes empty and duplicate tags", () => {
    expect(
      parseAutoTagResponse('{"tags":["react","React","   ", "react"]}'),
    ).toEqual(["react"]);
  });

  it("caps the number of suggestions", () => {
    const tags = Array.from({ length: 10 }, (_, index) => `tag-${index}`);

    expect(parseAutoTagResponse(JSON.stringify({ tags }))).toHaveLength(
      AUTO_TAG_MAX_TAGS,
    );
  });

  it("ignores non-string entries", () => {
    expect(
      parseAutoTagResponse('{"tags":["react", 42, null, {"x": 1}]}'),
    ).toEqual(["react"]);
  });

  it("returns an empty array for invalid JSON", () => {
    expect(parseAutoTagResponse("not json")).toEqual([]);
  });

  it("returns an empty array for an unexpected shape", () => {
    expect(parseAutoTagResponse('{"tags":"react"}')).toEqual([]);
    expect(parseAutoTagResponse("null")).toEqual([]);
  });
});

describe("truncateForDescription", () => {
  it("keeps content shorter than the limit untouched", () => {
    expect(truncateForDescription("short content")).toBe("short content");
  });

  it("cuts content at the configured limit", () => {
    const content = "a".repeat(DESCRIPTION_CONTENT_LIMIT + 50);

    expect(truncateForDescription(content)).toHaveLength(
      DESCRIPTION_CONTENT_LIMIT,
    );
  });
});

describe("buildDescriptionInput", () => {
  it("includes the type, title, content, URL and file name", () => {
    const input = buildDescriptionInput({
      title: "  Docker command  ",
      typeName: "Command",
      language: "bash",
      content: "docker compose up -d",
      url: "https://example.com",
      fileName: "compose.yml",
      tags: "docker, compose",
    });

    expect(input).toContain("Item type:\nCommand");
    expect(input).toContain("Language:\nbash");
    expect(input).toContain("Title:\nDocker command");
    expect(input).toContain("Content:\ndocker compose up -d");
    expect(input).toContain("URL:\nhttps://example.com");
    expect(input).toContain("File name:\ncompose.yml");
    expect(input).toContain("Tags:\ndocker, compose");
  });

  it("omits empty optional fields", () => {
    const input = buildDescriptionInput({ title: "My note", content: "  " });

    expect(input).toContain("Title:\nMy note");
    expect(input).not.toContain("Item type:");
    expect(input).not.toContain("Content:");
    expect(input).not.toContain("URL:");
    expect(input).not.toContain("File name:");
  });

  it("truncates long content before it is sent", () => {
    const input = buildDescriptionInput({
      title: "Title",
      content: "a".repeat(5_000),
    });

    expect(input).toContain("a".repeat(DESCRIPTION_CONTENT_LIMIT));
    expect(input).not.toContain("a".repeat(DESCRIPTION_CONTENT_LIMIT + 1));
  });

  it("mentions JSON in the input for json_object mode", () => {
    expect(buildDescriptionInput({ title: "Title" })).toMatch(/json/i);
  });
});

describe("normalizeDescription", () => {
  it("trims, collapses whitespace and removes surrounding quotes", () => {
    expect(normalizeDescription('  "A   short\n\tdescription."  ')).toBe(
      "A short description.",
    );
  });

  it("keeps descriptions at or under the limit", () => {
    const description = "a".repeat(DESCRIPTION_MAX_LENGTH);

    expect(normalizeDescription(description)).toHaveLength(
      DESCRIPTION_MAX_LENGTH,
    );
  });

  it("cuts over-long text on a sentence boundary when possible", () => {
    const description = `${"a".repeat(200)}. ${"b".repeat(300)}`;
    const result = normalizeDescription(description);

    expect(result).toHaveLength(201);
    expect(result.endsWith(".")).toBe(true);
  });

  it("falls back to a hard cut when there is no sentence boundary", () => {
    const description = "a".repeat(DESCRIPTION_MAX_LENGTH + 50);

    expect(normalizeDescription(description)).toHaveLength(
      DESCRIPTION_MAX_LENGTH,
    );
  });
});

describe("parseDescriptionResponse", () => {
  it("parses the object shape", () => {
    expect(
      parseDescriptionResponse(
        '{"description":"A React hook for tracking a counter."}',
      ),
    ).toBe("A React hook for tracking a counter.");
  });

  it("parses a bare JSON string", () => {
    expect(parseDescriptionResponse('"A reusable Docker command."')).toBe(
      "A reusable Docker command.",
    );
  });

  it("returns null for empty descriptions", () => {
    expect(parseDescriptionResponse('{"description":"   "}')).toBeNull();
    expect(parseDescriptionResponse('""')).toBeNull();
  });

  it("returns null for invalid JSON or an unexpected shape", () => {
    expect(parseDescriptionResponse("not json")).toBeNull();
    expect(parseDescriptionResponse("null")).toBeNull();
    expect(parseDescriptionResponse('{"description":42}')).toBeNull();
  });
});

describe("truncateForExplain", () => {
  it("keeps code shorter than the limit untouched", () => {
    expect(truncateForExplain("const x = 1;")).toBe("const x = 1;");
  });

  it("cuts code at the configured limit", () => {
    const code = "a".repeat(EXPLAIN_CONTENT_LIMIT + 50);

    expect(truncateForExplain(code)).toHaveLength(EXPLAIN_CONTENT_LIMIT);
  });
});

describe("buildExplainInput", () => {
  it("includes the type, language and code", () => {
    const input = buildExplainInput({
      content: "docker compose up -d",
      language: "bash",
      typeName: "Command",
    });

    expect(input).toContain("Type:\nCommand");
    expect(input).toContain("Language:\nbash");
    expect(input).toContain("Code:\ndocker compose up -d");
  });

  it("omits empty optional fields", () => {
    const input = buildExplainInput({ content: "const x = 1;" });

    expect(input).toBe("Code:\nconst x = 1;");
  });

  it("truncates long code before it is sent", () => {
    const input = buildExplainInput({
      content: "a".repeat(25_000),
    });

    expect(input).toContain("a".repeat(EXPLAIN_CONTENT_LIMIT));
    expect(input).not.toContain("a".repeat(EXPLAIN_CONTENT_LIMIT + 1));
  });
});

describe("parseExplainResponse", () => {
  it("trims the output", () => {
    expect(parseExplainResponse("  ## What it does\n\nIt counts.  ")).toBe(
      "## What it does\n\nIt counts.",
    );
  });

  it("unwraps a surrounding markdown fence", () => {
    expect(
      parseExplainResponse("```markdown\n## What it does\n\nIt counts.\n```"),
    ).toBe("## What it does\n\nIt counts.");
  });

  it("returns null for empty output", () => {
    expect(parseExplainResponse("   ")).toBeNull();
    expect(parseExplainResponse("```\n\n```")).toBeNull();
  });
});
