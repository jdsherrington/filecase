import { type AuthenticatedUser, requireUser } from "../auth/session";

export type TenantContext = {
  user: AuthenticatedUser;
  firmId: string;
};

export async function resolveTenantContext(
  request: Request,
): Promise<TenantContext> {
  const user = await requireUser(request);
  return {
    user,
    firmId: user.firmId,
  };
}
