import { z } from "zod";
import { UserRole } from "@prisma/client";

const brazilianPhoneRegex = /^(\+?55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

export const updateUserBodySchema = z.object({
  name: z.string().min(1).optional(),
  phone: z
    .string()
    .regex(brazilianPhoneRegex, "Invalid Brazilian phone number format")
    .nullable()
    .optional(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  tenantId: z.string().uuid(),
  phone: z.string().nullable(),
});

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
