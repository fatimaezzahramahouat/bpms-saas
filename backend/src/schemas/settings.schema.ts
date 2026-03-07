import { z } from "zod";

// ─── Profile ─────────────────────────────────────────────
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Password ────────────────────────────────────────────
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Notifications ───────────────────────────────────────
export const updateNotificationsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
});

export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;

// ─── Theme ───────────────────────────────────────────────
export const updateThemeSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    message: "Theme must be 'light', 'dark', or 'system'",
  }),
});

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

// ─── Organisation ────────────────────────────────────────
export const updateOrganisationSchema = z.object({
  logo: z.string().optional(),
  domaine: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
});

export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
