import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  grade_level: z.enum(['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'], {
    message: 'Please select your grade level',
  }),
  preferred_format: z.enum(['video', 'text'], {
    message: 'Please select your preferred learning format',
  }),
  avatar_selection: z.enum(['tech_bot', 'explorer', 'mentor'], {
    message: 'Please select your learning companion',
  }),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
