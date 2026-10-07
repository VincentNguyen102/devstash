import { describe, expect, it } from "vitest";
import { File, FileCode, FileJson, FileSpreadsheet, FileText } from "lucide-react";

import { getFileVisual } from "@/lib/file-type-meta";

describe("getFileVisual", () => {
  it("maps PDFs to the text icon with an uppercase label", () => {
    const visual = getFileVisual("report.pdf");

    expect(visual.Icon).toBe(FileText);
    expect(visual.label).toBe("PDF");
  });

  it("is case-insensitive and picks the right icon per group", () => {
    expect(getFileVisual("DATA.JSON").Icon).toBe(FileJson);
    expect(getFileVisual("notes.md").Icon).toBe(FileText);
    expect(getFileVisual("rows.csv").Icon).toBe(FileSpreadsheet);
    expect(getFileVisual("config.yaml").Icon).toBe(FileCode);
    expect(getFileVisual("config.yml").Icon).toBe(FileCode);
    expect(getFileVisual("pom.xml").Icon).toBe(FileCode);
    expect(getFileVisual("Cargo.toml").Icon).toBe(FileCode);
    expect(getFileVisual("settings.ini").Icon).toBe(FileCode);
  });

  it("falls back to a generic file icon for unknown extensions", () => {
    const visual = getFileVisual("archive.exe");

    expect(visual.Icon).toBe(File);
    expect(visual.label).toBe("EXE");
  });

  it("labels files without an extension as FILE", () => {
    expect(getFileVisual("README").label).toBe("FILE");
    expect(getFileVisual("README").Icon).toBe(File);
    expect(getFileVisual("trailing.").label).toBe("FILE");
  });

  it("handles a missing file name", () => {
    expect(getFileVisual(null).Icon).toBe(File);
    expect(getFileVisual(undefined).label).toBe("FILE");
  });
});
