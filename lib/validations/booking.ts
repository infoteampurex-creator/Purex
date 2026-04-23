import { z } from 'zod';

// Step 1: Service selection — just stores the choice
export const serviceSelectionSchema = z.object({
  expertSlug: z.string().min(1),
  serviceId: z.string().uuid().or(z.string().min(1)), // uuid once DB wired, slug for now
});

// Step 2: Pre-consultation form — dynamic based on template
// For typing: the form is `Record<string, string | string[]>` until validated per template
export const formResponseSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())])
);

// Step 3: Schedule preferences
export const schedulingSchema = z.object({
  preferredDate: z.string().min(1, 'Pick a preferred date'),
  preferredTimeSlot: z.enum(['morning', 'afternoon', 'evening'], {
    errorMap: () => ({ message: 'Pick a time slot' }),
  }),
  alternateDate: z.string().optional(),
  format: z.enum(['online', 'in_person', 'hybrid']).default('online'),
});

// Step 4: Full booking submission
export const bookingSubmitSchema = z.object({
  // Personal
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name too long'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^[\d\s+()-]+$/, 'Only digits, spaces, and + ( ) - allowed'),

  // Context (from previous steps)
  expertSlug: z.string().min(1),
  serviceId: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTimeSlot: z.enum(['morning', 'afternoon', 'evening']),
  alternateDate: z.string().optional(),
  format: z.enum(['online', 'in_person', 'hybrid']).default('online'),

  // Pre-consult form response
  formResponse: formResponseSchema,

  // Meta
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to be contacted' }),
  }),
  source: z.string().default('booking_flow'),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type BookingSubmitInput = z.infer<typeof bookingSubmitSchema>;

// Contact form (separate from booking)
export const contactSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional().or(z.literal('')),
  subject: z.string().max(120).optional().or(z.literal('')),
  message: z.string().min(10, 'Please share a bit more').max(2000),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to be contacted' }),
  }),
});

export type ContactInput = z.infer<typeof contactSchema>;
