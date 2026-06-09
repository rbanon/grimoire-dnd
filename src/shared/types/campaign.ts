import { z } from 'zod'

export const CampaignTagSchema = z.string().max(40)

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  tags: z.array(CampaignTagSchema),
  myCharacterId: z.string().uuid().nullable().default(null),
  myCharacterName: z.string().max(120).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Campaign = z.infer<typeof CampaignSchema>

export const CampaignSessionSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  sessionNumber: z.number().int().min(1),
  title: z.string().max(200).optional(),
  date: z.string().optional(),
  body: z.string().max(20000).default(''),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type CampaignSession = z.infer<typeof CampaignSessionSchema>

export const NPCSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  sessionId: z.string().uuid().nullable().default(null),
  name: z.string().min(1).max(120),
  description: z.string().max(5000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type NPC = z.infer<typeof NPCSchema>

export const PartyMemberSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(120),
  player: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type PartyMember = z.infer<typeof PartyMemberSchema>

export const CampaignNoteSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  sessionId: z.string().uuid().nullable().default(null),
  title: z.string().max(200),
  body: z.string().max(20000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type CampaignNote = z.infer<typeof CampaignNoteSchema>

export const KeyObjectSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  sessionId: z.string().uuid().nullable().default(null),
  name: z.string().min(1).max(120),
  description: z.string().max(5000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type KeyObject = z.infer<typeof KeyObjectSchema>
