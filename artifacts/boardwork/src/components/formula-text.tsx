import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormulaNode =
  | { kind: "text"; value: string }
  | { kind: "group"; children: FormulaNode[] }
  | { kind: "fraction"; numerator: FormulaNode[]; denominator: FormulaNode[] }
  | { kind: "sqrt"; index?: FormulaNode[]; radicand: FormulaNode[] }
  | {
      kind: "script";
      base: FormulaNode;
      superscript?: FormulaNode[];
      subscript?: FormulaNode[];
    };

type FormulaSegment =
  | { kind: "text"; value: string }
  | {
      kind: "formula";
      source: string;
      display: boolean;
      nodes: FormulaNode[] | null;
    };

type ParseResult = {
  nodes: FormulaNode[];
  index: number;
};

const symbols: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  sigma: "σ",
  phi: "φ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Pi: "Π",
  Sigma: "Σ",
  Phi: "Φ",
  Omega: "Ω",
  times: "×",
  cdot: "·",
  div: "÷",
  pm: "±",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  neq: "≠",
  ne: "≠",
  approx: "≈",
  equiv: "≡",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  degree: "°",
  infty: "∞",
  sum: "∑",
  prod: "∏",
  partial: "∂",
  nabla: "∇",
};

const escapedSymbols: Record<string, string> = {
  "{": "{",
  "}": "}",
  "_": "_",
  "^": "^",
  "%": "%",
  "&": "&",
  "#": "#",
  "$": "$",
  "\\": "\\",
};

function isAllowedPlainCharacter(character: string) {
  return /[\p{L}\p{N}=+\-*/.,:;!?()[\]|<>·°]/u.test(character);
}

function parseGroup(source: string, start: number): ParseResult | null {
  if (source[start] !== "{") return null;
  const result = parseSequence(source, start + 1, true);
  if (result.index >= source.length || source[result.index] !== "}") return null;
  return {
    nodes: [{ kind: "group", children: result.nodes }],
    index: result.index + 1,
  };
}

function parseScriptArgument(
  source: string,
  start: number,
): ParseResult | null {
  if (source[start] === "{") return parseGroup(source, start);
  return parseAtom(source, start);
}

function parseCommand(source: string, start: number): ParseResult | null {
  let index = start + 1;
  if (index >= source.length) return null;

  if (!/[A-Za-z]/.test(source[index])) {
    const value = escapedSymbols[source[index]];
    return value === undefined
      ? null
      : { nodes: [{ kind: "text", value }], index: index + 1 };
  }

  const commandStart = index;
  while (index < source.length && /[A-Za-z]/.test(source[index])) index += 1;
  const command = source.slice(commandStart, index);

  if (command === "left" || command === "right") {
    while (index < source.length && /\s/.test(source[index])) index += 1;
    if (index >= source.length || !isAllowedPlainCharacter(source[index])) {
      return null;
    }
    return {
      nodes: [{ kind: "text", value: source[index] }],
      index: index + 1,
    };
  }

  if (command === "frac") {
    const numerator = parseGroup(source, index);
    if (!numerator) return null;
    const denominator = parseGroup(source, numerator.index);
    if (!denominator) return null;
    return {
      nodes: [
        {
          kind: "fraction",
          numerator: unwrapGroup(numerator.nodes),
          denominator: unwrapGroup(denominator.nodes),
        },
      ],
      index: denominator.index,
    };
  }

  if (command === "sqrt") {
    let rootIndex: FormulaNode[] | undefined;
    if (source[index] === "[") {
      const closingIndex = source.indexOf("]", index + 1);
      if (closingIndex === -1) return null;
      const optional = parseFormula(source.slice(index + 1, closingIndex));
      if (!optional) return null;
      rootIndex = optional;
      index = closingIndex + 1;
    }
    const radicand = parseGroup(source, index);
    if (!radicand) return null;
    return {
      nodes: [
        {
          kind: "sqrt",
          index: rootIndex,
          radicand: unwrapGroup(radicand.nodes),
        },
      ],
      index: radicand.index,
    };
  }

  if (command === "text" || command === "mathrm") {
    const group = parseGroup(source, index);
    if (!group) return null;
    return group;
  }

  const symbol = symbols[command];
  return symbol
    ? { nodes: [{ kind: "text", value: symbol }], index }
    : null;
}

function parseAtom(source: string, start: number): ParseResult | null {
  const character = source[start];
  if (!character) return null;
  if (character === "{") return parseGroup(source, start);
  if (character === "\\") return parseCommand(source, start);
  if (isAllowedPlainCharacter(character)) {
    return {
      nodes: [{ kind: "text", value: character }],
      index: start + 1,
    };
  }
  return null;
}

function unwrapGroup(nodes: FormulaNode[]) {
  if (nodes.length === 1 && nodes[0].kind === "group") {
    return nodes[0].children;
  }
  return nodes;
}

function addScript(
  nodes: FormulaNode[],
  kind: "superscript" | "subscript",
  value: FormulaNode[],
) {
  const previous = nodes.pop();
  if (!previous) return false;
  if (previous.kind === "script") {
    if (previous[kind]) return false;
    previous[kind] = value;
    nodes.push(previous);
  } else {
    nodes.push({
      kind: "script",
      base: previous,
      [kind]: value,
    });
  }
  return true;
}

function parseSequence(
  source: string,
  start: number,
  stopAtClosingBrace = false,
): ParseResult {
  const nodes: FormulaNode[] = [];
  let index = start;

  while (index < source.length) {
    const character = source[index];
    if (stopAtClosingBrace && character === "}") break;
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "^" || character === "_") {
      const argument = parseScriptArgument(source, index + 1);
      if (!argument) return { nodes: [], index: source.length + 1 };
      if (
        !addScript(
          nodes,
          character === "^" ? "superscript" : "subscript",
          unwrapGroup(argument.nodes),
        )
      ) {
        return { nodes: [], index: source.length + 1 };
      }
      index = argument.index;
      continue;
    }
    const atom = parseAtom(source, index);
    if (!atom) return { nodes: [], index: source.length + 1 };
    nodes.push(...atom.nodes);
    index = atom.index;
  }

  return { nodes, index };
}

function parseFormula(source: string): FormulaNode[] | null {
  const trimmed = source.trim();
  if (!trimmed) return null;
  const result = parseSequence(trimmed, 0);
  if (result.index !== trimmed.length || result.nodes.length === 0) return null;
  return result.nodes;
}

function findStandaloneFormula(source: string, start: number) {
  if (source[start] === "\\") {
    const command = parseCommand(source, start);
    if (!command) return null;
    return {
      end: command.index,
      nodes: parseFormula(source.slice(start, command.index)),
    };
  }

  if (!/[A-Za-z]/.test(source[start])) return null;
  let scriptIndex = start;
  while (scriptIndex < source.length && /[A-Za-z]/.test(source[scriptIndex])) {
    scriptIndex += 1;
  }
  if (source[scriptIndex] !== "^" && source[scriptIndex] !== "_") return null;
  const argument = parseScriptArgument(source, scriptIndex + 1);
  if (!argument) return null;
  const end = argument.index;
  return {
    end,
    nodes: parseFormula(source.slice(start, end)),
  };
}

function findClosingDelimiter(
  source: string,
  start: number,
  delimiter: string,
) {
  let index = start;
  while (index < source.length) {
    index = source.indexOf(delimiter, index);
    if (index === -1) return -1;
    let slashCount = 0;
    for (let slashIndex = index - 1; slashIndex >= 0 && source[slashIndex] === "\\"; slashIndex -= 1) {
      slashCount += 1;
    }
    if (slashCount % 2 === 0) return index;
    index += delimiter.length;
  }
  return -1;
}

export function parseFormulaText(source: string): FormulaSegment[] {
  const segments: FormulaSegment[] = [];
  let textStart = 0;
  let index = 0;

  const appendText = (value: string) => {
    if (!value) return;
    const previous = segments[segments.length - 1];
    if (previous?.kind === "text") previous.value += value;
    else segments.push({ kind: "text", value });
  };

  while (index < source.length) {
    const delimiter =
      source.startsWith("$$", index)
        ? { open: "$$", close: "$$", display: true }
        : source.startsWith("\\[", index)
          ? { open: "\\[", close: "\\]", display: true }
          : source.startsWith("\\(", index)
            ? { open: "\\(", close: "\\)", display: false }
            : source[index] === "$" && source[index - 1] !== "\\"
              ? { open: "$", close: "$", display: false }
              : null;

    if (!delimiter) {
      const standalone = findStandaloneFormula(source, index);
      if (standalone?.nodes) {
        appendText(source.slice(textStart, index));
        segments.push({
          kind: "formula",
          source: source.slice(index, standalone.end),
          display: false,
          nodes: standalone.nodes,
        });
        index = standalone.end;
        textStart = index;
        continue;
      }
      index += 1;
      continue;
    }

    const closingIndex = findClosingDelimiter(
      source,
      index + delimiter.open.length,
      delimiter.close,
    );
    if (closingIndex === -1) {
      // An unmatched delimiter makes the rest of the field source text.
      // This prevents a partial formula from being rendered accidentally.
      index = source.length;
      break;
    }

    appendText(source.slice(textStart, index));
    const formulaSource = source.slice(
      index + delimiter.open.length,
      closingIndex,
    );
    segments.push({
      kind: "formula",
      source: source.slice(index, closingIndex + delimiter.close.length),
      display: delimiter.display,
      nodes: parseFormula(formulaSource),
    });
    index = closingIndex + delimiter.close.length;
    textStart = index;
  }

  appendText(source.slice(textStart));
  return segments;
}

function renderNodes(nodes: FormulaNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.kind === "text") return <span key={key}>{node.value}</span>;
    if (node.kind === "group") return <span key={key}>{renderNodes(node.children, key)}</span>;
    if (node.kind === "fraction") {
      return (
        <span className="formula-fraction" key={key}>
          <span className="formula-fraction-part">{renderNodes(node.numerator, `${key}-n`)}</span>
          <span className="formula-fraction-line" aria-hidden="true" />
          <span className="formula-fraction-part">{renderNodes(node.denominator, `${key}-d`)}</span>
        </span>
      );
    }
    if (node.kind === "sqrt") {
      return (
        <span className="formula-root" key={key}>
          {node.index && <sup className="formula-root-index">{renderNodes(node.index, `${key}-i`)}</sup>}
          <span className="formula-root-sign" aria-hidden="true">√</span>
          <span className="formula-root-content">{renderNodes(node.radicand, `${key}-r`)}</span>
        </span>
      );
    }
    return (
      <span className="formula-script" key={key}>
        <span className="formula-script-base">{renderNodes([node.base], `${key}-b`)}</span>
        {node.superscript && <sup>{renderNodes(node.superscript, `${key}-s`)}</sup>}
        {node.subscript && <sub>{renderNodes(node.subscript, `${key}-d`)}</sub>}
      </span>
    );
  });
}

export function hasFormulaNotation(source: string) {
  return parseFormulaText(source).some((segment) => segment.kind === "formula");
}

export function FormulaText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const segments = parseFormulaText(children);
  return (
    <span className={cn("formula-text", className)}>
      {segments.map((segment, index) => {
        if (segment.kind === "text") return <span key={index}>{segment.value}</span>;
        if (!segment.nodes) {
          return (
            <span className="formula-fallback" key={index}>
              {segment.source}
            </span>
          );
        }
        return (
          <span
            className={cn(
              "formula-rendered",
              segment.display && "formula-rendered--block",
            )}
            data-formula
            key={index}
          >
            {renderNodes(segment.nodes, `formula-${index}`)}
          </span>
        );
      })}
    </span>
  );
}

export function FormulaPreview({ children }: { children: string }) {
  if (!hasFormulaNotation(children)) return null;
  return (
    <div className="formula-editor-preview" aria-label="Rendered formula preview">
      <span className="formula-editor-preview-label">Formula preview</span>
      <FormulaText>{children}</FormulaText>
    </div>
  );
}