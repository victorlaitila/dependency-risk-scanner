import { describe, it, expect } from "vitest";
import { generateWhyThisMatters } from "../lib/why-this-matters";
import { strings } from "../lib/strings";

const testStrings = strings.aiExplanationPanel.whyThisMatters;

describe("generateWhyThisMatters", () => {
  // High impact tests
  it("generates high impact + no critical message", () => {
    const result = generateWhyThisMatters(5.5, false, testStrings);
    expect(result).toContain("structurally central");
    expect(result).toContain("downstream dependencies");
    expect(result).toContain("no critical security issues");
  });

  it("generates high impact + critical message", () => {
    const result = generateWhyThisMatters(5.5, true, testStrings);
    expect(result).toContain("both structurally central");
    expect(result).toContain("critical vulnerabilities");
    expect(result).toContain("particularly important to review");
  });

  // Medium impact tests
  it("generates medium impact + no critical message", () => {
    const result = generateWhyThisMatters(3.0, false, testStrings);
    expect(result).toContain("moderate structural reach");
    expect(result).toContain("no known security vulnerabilities");
  });

  it("generates medium impact + critical message", () => {
    const result = generateWhyThisMatters(3.0, true, testStrings);
    expect(result).toContain("moderate structural reach");
    expect(result).toContain("critical vulnerabilities");
  });

  // Low impact tests
  it("generates low impact + no critical message", () => {
    const result = generateWhyThisMatters(1.0, false, testStrings);
    expect(result).toContain("limited structural reach");
    expect(result).toContain("no known security vulnerabilities");
    expect(result).toContain("lower immediate concern");
  });

  it("generates low impact + critical message", () => {
    const result = generateWhyThisMatters(1.0, true, testStrings);
    expect(result).toContain("limited structural reach");
    expect(result).toContain("critical vulnerabilities");
  });

  // Boundary tests
  it("treats impact exactly 5 as high", () => {
    const result = generateWhyThisMatters(5.0, false, testStrings);
    expect(result).toContain("structurally central");
  });

  it("treats impact exactly 2 as medium", () => {
    const result = generateWhyThisMatters(2.0, false, testStrings);
    expect(result).toContain("moderate");
  });

  it("treats impact 1.99 as low", () => {
    const result = generateWhyThisMatters(1.99, false, testStrings);
    expect(result).toContain("limited");
  });

  it("treats impact 4.99 as medium", () => {
    const result = generateWhyThisMatters(4.99, false, testStrings);
    expect(result).toContain("moderate");
  });
});
