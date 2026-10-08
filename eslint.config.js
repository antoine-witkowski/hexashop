import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default defineConfig(
  { ignores: ["**/dist/**", "**/coverage/**", "**/generated/**"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.ts", "services/*/prisma.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["services/*/src/domain/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\.)",
              message:
                "domain/ must not depend on any package: keep it pure TypeScript.",
            },
            {
              regex: "(^|/)(infrastructure|application)(/|$)",
              message:
                "domain/ is the core of the hexagon: it must not import any other layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["services/*/src/application/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "pg",
              message:
                "Use cases must not know about the database: depend on a port and implement it in infrastructure/.",
            },
            {
              name: "@confluentinc/kafka-javascript",
              message:
                "Use cases must not know about Kafka: depend on a port and implement it in infrastructure/.",
            },
          ],
          patterns: [
            {
              regex: "(^|/)infrastructure(/|$)",
              message:
                "application/ must not import infrastructure/: depend on a port instead.",
            },
            {
              regex: "^@nestjs/",
              message:
                "Use cases must not depend on NestJS: wire them in an infrastructure module instead.",
            },
            {
              regex: "^@prisma/|(^|/)generated(/|$)",
              message:
                "Use cases must not depend on Prisma: go through the OrderRepository port.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowWithDecorator: true },
      ],
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
