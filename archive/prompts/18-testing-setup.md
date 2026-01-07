# Prompt 18: Testing Setup

```
Setup testing infrastructure:

1. Rust tests in src-tauri/:
   - cargo test setup
   - Unit tests for calculator.rs
   - Unit tests for modifiers.rs
   - Integration tests for database operations
   - Mock Database trait for testing

2. Frontend tests:
   - Install vitest, @testing-library/react
   - Configure vitest.config.ts
   - Test utilities in src/test-utils.ts
   - Mock Tauri API

3. Example tests:
   - AttributeBlock.test.tsx
   - calculator.test.rs
   - modifiers.test.rs
   - character-crud integration test

4. Add test scripts:
   - "test": "vitest"
   - "test:rust": "cd src-tauri && cargo test"
   - "test:coverage": "vitest --coverage"

5. CI/CD with GitHub Actions (optional)
```






