import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
