import { loginSchema } from "@filecase/shared";

import { verifyPassword } from "./password";
import { createSession, findUserByEmail, updateLastLogin } from "./session";

export async function loginWithPassword(rawInput: {
  email: string;
  password: string;
}): Promise<{
  userId: string;
  firmId: string;
  role: "admin" | "manager" | "staff";
} | null> {
  const input = loginSchema.parse(rawInput);

  const user = await findUserByEmail(input.email.toLowerCase());

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  await createSession({
    id: user.id,
    firmId: user.firmId,
  });

  await updateLastLogin(user.id);

  return {
    userId: user.id,
    firmId: user.firmId,
    role: user.role,
  };
}
