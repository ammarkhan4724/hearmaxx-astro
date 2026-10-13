import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const hearingHealth = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/hearing-health' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    publishDate: z.string().optional(),
    author: z.string().default('Sheeraz Rahim'),
    authorTitle: z.string().default('Hearing Care Specialist'),
    featuredImage: z.string().optional(),
  }),
});

export const collections = {
  hearingHealth,
};
