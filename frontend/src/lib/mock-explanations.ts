// Hardcoded explanations for mock mode packages
const MOCK_EXPLANATIONS: Record<string, string> = {
  react:
    "react 18.3.1 has a relative structural impact score of 7, indicating high structural impact. It serves as a foundational dependency with 9 direct dependents, creating significant reach across the dependency tree; no critical issues are present.",
  "@tanstack/react-query":
    "@tanstack/react-query 5.52.0 has a relative structural impact score of 5, indicating moderate structural impact. It influences 4 direct dependents with moderate propagation across the dependency chain; 1 known vulnerability is present.",
  "lucide-react":
    "lucide-react 0.462.0 has a relative structural impact score of 3, indicating low structural impact. It reaches 1 direct dependent with limited downstream propagation; no critical issues are present.",
  "react-router-dom":
    "react-router-dom 6.27.0 has a relative structural impact score of 3, indicating low structural impact. It affects 2 direct dependents with contained downstream reach; no critical issues are present.",
  zustand:
    "zustand 4.5.5 has a relative structural impact score of 2, indicating low structural impact. It reaches 1 direct dependent with minimal downstream propagation; no critical issues are present.",
  axios:
    "axios 1.7.2 has a relative structural impact score of 3, indicating moderate structural impact. It influences 2 direct dependents across the dependency tree; 1 known vulnerability with high severity is present.",
  "date-fns":
    "date-fns 3.6.0 has a relative structural impact score of 2, indicating low structural impact. It is a leaf node with no further downstream dependents, minimizing propagation risk; no critical issues are present.",
  zod:
    "zod 3.23.8 has a relative structural impact score of 2, indicating low structural impact. It reaches 1 direct dependent with minimal downstream propagation; no critical issues are present.",
  vite:
    "vite 5.4.19 has a relative structural impact score of 2, indicating low structural impact. It influences 1 direct dependent with contained downstream reach; 2 known vulnerabilities including 1 critical are present.",
  esbuild:
    "esbuild 0.23.1 has a relative structural impact score of 1, indicating minimal structural impact. It is a leaf node with no downstream dependents, significantly limiting risk exposure; 1 known vulnerability with low severity is present.",
};

export function getMockExplanation(name: string): string | null {
  return MOCK_EXPLANATIONS[name.toLowerCase()] ?? null;
}
