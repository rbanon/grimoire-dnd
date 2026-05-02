import { z } from 'zod'

export const CampaignTagSchema = z.string().max(40)

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  tags: z.array(CampaignTagSchema),
  linkedCharacterIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Campaign = z.infer<typeof CampaignSchema>

export const CampaignSessionSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  sessionNumber: z.number().int().min(1),
  title: z.string().max(200).optional(),
  date: z.string().optional(), // ISO date string
  summary: z.string().max(10000),
  tags: z.array(CampaignTagSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type CampaignSession = z.infer<typeof CampaignSessionSchema>

export const NPCSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(120),
  race: z.string().max(80).optional(),
  occupation: z.string().max(120).optional(),
  alignment: z.string().max(40).optional(),
  description: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(CampaignTagSchema),
  isAlive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type NPC = z.infer<typeof NPCSchema>

export const CampaignNoteSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  title: z.string().max(200),
  body: z.string().max(20000),
  tags: z.array(CampaignTagSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type CampaignNote = z.infer<typeof CampaignNoteSchema>
