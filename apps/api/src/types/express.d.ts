// apps/api/src/types/express.d.ts
import type { AuthObject } from '@clerk/backend/dist/types/tokens/authObjects'; // Adjust path if needed

declare global {
  namespace Express {
    interface Request {
      auth?: AuthObject; // Use the specific type from Clerk
    }
  }
}

export {}; // Make this a module
