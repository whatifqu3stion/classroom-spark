import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CurriculumSnapshot } from "@workspace/api-zod";
import { CurriculumSnapshotDetails } from "./curriculum-snapshot-details";

describe("teacher curriculum snapshot", () => {
  it("keeps quotations collapsed and links PDFs through their protected class/source route", () => {
    const snapshot: CurriculumSnapshot = {
      version: 1,
      focus: { objective: "Identify user needs", thinkingTask: "Observe", responseMode: "Write", context: "A cup", combinationKey: "fixture" },
      sources: [{ sourceId: "source-fixture", version: 1, title: "Teacher design notes", kind: "pdf",
        subject: "Design", programmeYear: "2", publisher: null, url: null, locator: "Page 2",
        excerpt: "PRIVATE QUOTATION", objective: "Identify user needs", retrievedAt: null }],
    };
    render(<CurriculumSnapshotDetails classId="class-fixture" snapshot={snapshot} />);
    expect(screen.queryByText(/PRIVATE QUOTATION/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Based on curriculum" }));
    expect(screen.getByText(/PRIVATE QUOTATION/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open saved PDF" })).toHaveAttribute(
      "href", "/api/classes/class-fixture/curriculum/source-fixture/file#page=2",
    );
    expect(screen.getByText(/quotation remains after deletion/)).toBeInTheDocument();
  });
});