type Token = number | string;

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
};

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index++;
      continue;
    }

    const prev = tokens[tokens.length - 1];
    const unaryMinus =
      char === "-" &&
      (tokens.length === 0 || (typeof prev === "string" && prev !== ")"));

    if (/\d|\./.test(char) || unaryMinus) {
      let raw = unaryMinus ? "-" : "";
      if (unaryMinus) index++;
      let dotCount = 0;

      while (index < expression.length && /[\d.]/.test(expression[index])) {
        if (expression[index] === ".") dotCount++;
        if (dotCount > 1) throw new Error("Invalid number");
        raw += expression[index];
        index++;
      }

      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error("Invalid number");
      tokens.push(value);
      continue;
    }

    if ("+-*/()".includes(char)) {
      tokens.push(char);
      index++;
      continue;
    }

    throw new Error("Invalid character");
  }

  return tokens;
}

function toReversePolish(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operators: string[] = [];

  for (const token of tokens) {
    if (typeof token === "number") {
      output.push(token);
    } else if (token in PRECEDENCE) {
      while (
        operators.length &&
        operators[operators.length - 1] in PRECEDENCE &&
        PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[token]
      ) {
        output.push(operators.pop() as string);
      }
      operators.push(token);
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        output.push(operators.pop() as string);
      }
      if (operators.pop() !== "(") throw new Error("Mismatched parentheses");
    }
  }

  while (operators.length) {
    const op = operators.pop() as string;
    if (op === "(" || op === ")") throw new Error("Mismatched parentheses");
    output.push(op);
  }

  return output;
}

export function calculateExpression(expression: string): number {
  const tokens = toReversePolish(tokenize(expression));
  const stack: number[] = [];

  for (const token of tokens) {
    if (typeof token === "number") {
      stack.push(token);
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (left === undefined || right === undefined) throw new Error("Invalid expression");

    if (token === "+") stack.push(left + right);
    else if (token === "-") stack.push(left - right);
    else if (token === "*") stack.push(left * right);
    else if (token === "/") {
      if (right === 0) throw new Error("Division by zero");
      stack.push(left / right);
    }
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    throw new Error("Invalid expression");
  }

  return stack[0];
}
