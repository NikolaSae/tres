// lib/validations/dashboard.ts
import { z } from 'zod';

export const emailSearchSchema = z.object({
  email: z.string().email('Nevažeća email adresa').min(1, 'Email je obavezan')
});

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(10000)
    })
  ).min(1).max(100) // Limit conversation history
});

export const userIdSchema = z.object({
  userId: z.string().uuid('Nevažeći format korisničkog ID-a')
});

// Input sanitization for search queries
export const searchQuerySchema = z.object({
  query: z.string()
    .max(200, 'Pretraga je predugačka')
    .transform(val => val.trim())
    .refine(
      val => !val.includes('../') && !val.includes('..\\'),
      'Nevažeći karakter u pretrazi'
    )
});