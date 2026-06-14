// ESLint flat config (ESLint 9). eslint-config-next 16 ships flat configs directly,
// so they are spread in without the FlatCompat shim.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
