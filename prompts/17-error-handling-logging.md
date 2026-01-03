# Prompt 17: Error Handling & Logging

```
Implement error handling system:

1. src/lib/errors.ts:
   - Custom error classes: DatabaseError, ValidationError, NetworkError
   - formatError(error: Error): string
   - logError(error: Error, context: string): void

2. src/components/ErrorBoundary.tsx:
   - React error boundary
   - Display user-friendly error page
   - Log to console
   - Report button

3. src-tauri/src/utils/logger.rs:
   - init_logger() function
   - Log to file in app data dir
   - Rotate logs (max 5 files, 10MB each)
   - Different log levels: ERROR, WARN, INFO, DEBUG

4. Toast notifications for user errors:
   - Install react-hot-toast
   - Wrapper component for consistent styling
   - Auto-dismiss after 5 seconds

5. Integrate throughout application
```




