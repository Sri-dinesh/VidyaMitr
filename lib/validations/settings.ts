import { z } from 'zod';

export const settingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
  grade_level: z.enum(['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']),
  preferred_format: z.enum(['video', 'text']),
  family_companion: z.enum(['mother', 'father', 'sibling']),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
