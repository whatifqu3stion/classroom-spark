import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormulaText, hasFormulaNotation, parseFormulaText } from "./formula-text";

describe("FormulaText", () => {
  it("typesets common math and science notation", () => {
    render(
      <FormulaText>
        {"Solve \\(\\frac{1}{2}x^2 + \\sqrt{9}\\) and label \\(H_2O, \\alpha, and \\leq\\)."}
      </FormulaText>,
    );

    expect(screen.queryByText(/\\frac|\\sqrt/)).not.toBeInTheDocument();
    expect(document.querySelector(".formula-fraction")).toBeInTheDocument();
    expect(document.querySelector(".formula-root")).toBeInTheDocument();
    expect(document.querySelector(".formula-script > sup")).toBeInTheDocument();
    expect(document.querySelector(".formula-script > sub")).toBeInTheDocument();
    expect(screen.getByText("α")).toBeInTheDocument();
    expect(screen.getByText("≤")).toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("supports block delimiters without exposing markup", () => {
    render(<FormulaText>{"Before $$E = mc^2$$ after"}</FormulaText>);

    const formula = document.querySelector(".formula-rendered--block");
    expect(formula).toBeInTheDocument();
    expect(formula).toHaveTextContent("E=mc");
    expect(screen.queryByText("$$")).not.toBeInTheDocument();
  });

  it("keeps Unicode math symbols and supplementary-plane characters intact", () => {
    render(<FormulaText>{"$$∀x ∈ ℝ, x ≥ 0 → ✅$$"}</FormulaText>);

    expect(document.querySelector(".formula-fallback")).not.toBeInTheDocument();
    expect(document.querySelector(".formula-rendered")).toHaveTextContent(
      "∀x∈ℝ,x≥0→✅",
    );
  });

  it("recognizes clear standalone science fragments without rewriting ordinary prose", () => {
    render(<FormulaText>{"Label H_2O, \\alpha, and x^2 in plain text."}</FormulaText>);

    expect(document.querySelectorAll(".formula-rendered")).toHaveLength(3);
    expect(screen.getByText("α")).toBeInTheDocument();
    expect(screen.queryByText(/H_2O|\\alpha|x\\^2/)).not.toBeInTheDocument();
  });

  it("leaves plain text and invalid notation readable", () => {
    const plain = "No formula here.";
    const invalid = "Try $\\unknown{x}$ safely.";
    render(
      <div>
        <FormulaText>{plain}</FormulaText>
        <FormulaText>{invalid}</FormulaText>
      </div>,
    );

    expect(screen.getByText(plain)).toBeInTheDocument();
    expect(document.querySelectorAll(".formula-text")[1]).toHaveTextContent(invalid);
    expect(document.querySelector(".formula-fallback")).toHaveTextContent("\\unknown{x}");
    expect(hasFormulaNotation(plain)).toBe(false);
    expect(parseFormulaText("Unclosed $x^2")).toEqual([
      { kind: "text", value: "Unclosed $x^2" },
    ]);
  });
});