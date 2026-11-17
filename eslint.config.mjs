import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Links never prefetch on their own (see src/components/Link.tsx)
    ignores: ["src/components/Link.tsx"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "next/link", message: "Use @/components/Link (no automatic prefetch)." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Android app shell (Capacitor), not part of the site
    "mobile/**",
    // Cloudflare build output (OpenNext, wrangler)
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",
  ]),
]);

export default eslintConfig;
