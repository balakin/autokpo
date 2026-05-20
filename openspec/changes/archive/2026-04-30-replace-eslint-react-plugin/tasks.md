## 1. Dependencies

- [x] 1.1 Install `@eslint-react/eslint-plugin` in root `devDependencies` (`pnpm add -D -w @eslint-react/eslint-plugin`)
- [x] 1.2 Remove `eslint-plugin-react` and `eslint-plugin-react-hooks` from root `devDependencies`

## 2. ESLint Config

- [x] 2.1 Replace `import react from 'eslint-plugin-react'` and `import reactHooks from 'eslint-plugin-react-hooks'` with `import * as reactX from '@eslint-react/eslint-plugin'` in `eslint.config.ts`
- [x] 2.2 In the app-source config block, replace `react.configs.flat.recommended`, `react.configs.flat['jsx-runtime']`, and `reactHooks.configs.flat['recommended-latest']` extends with `reactX.configs['recommended-type-checked']`
- [x] 2.3 In the app-tests config block, apply the same extends replacement as 2.2
- [x] 2.4 Remove `settings: { react: { version: 'detect' } }` from both app-source and app-tests config blocks

## 3. Verification

- [x] 3.1 Run `pnpm -s eslint apps/app --format=json | jq '[.[] | select(.errorCount > 0)]'` and fix any new violations
- [x] 3.2 Run `cd apps/app && pnpm -s test --reporter=json --changed | jq '{passed:.numPassedTests,failed:.numFailedTests}'` to confirm no regressions
- [x] 3.3 Run `cd apps/app && pnpm -s build 2>&1 | grep -E "error TS|error:" | head -n 20` to confirm build is clean
