import { z } from 'zod'

import { deviceTypes, priorityLevels } from './types'

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))

export const priorityLevelSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)],
)

export const deviceTypeSchema = z.enum(deviceTypes)

export const nocIssueSchema = z.object({
  id: z.string().trim().min(1, 'Issue ID is required'),
  storeId: z.string().trim().min(1, 'Store ID is required'),
  priority: priorityLevelSchema,
  category: z.string().trim().min(1, 'Category is required'),
  deviceType: deviceTypeSchema,
  ticketUrl: optionalTrimmedString.pipe(z.url().optional()),
  notes: optionalTrimmedString,
  dataUsageGb: z.number().finite().nonnegative().optional(),
  rawDataUsage: optionalTrimmedString,
  sourceSection: optionalTrimmedString,
})

export const parserWarningSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  rowNumber: z.number().int().positive().optional(),
  priority: priorityLevelSchema.optional(),
  rawRow: z.array(z.string()).optional(),
})

export type ValidatedNocIssue = z.infer<typeof nocIssueSchema>
