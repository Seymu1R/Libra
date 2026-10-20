import { z } from "zod";

// Shapes per ProjectDocs/APIDocs/the-odds-api-v4.md. Unknown extra fields are ignored;
// missing required fields fail loudly (project-context rule 4).

export const sportSchema = z.object({
  key: z.string(),
  group: z.string(),
  title: z.string(),
  description: z.string(),
  active: z.boolean(),
  has_outrights: z.boolean(),
});
export const sportsResponseSchema = z.array(sportSchema);
export type Sport = z.infer<typeof sportSchema>;

export const eventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string().optional(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
});
export const eventsResponseSchema = z.array(eventSchema);
export type ApiEvent = z.infer<typeof eventSchema>;

export const outcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
  point: z.number().optional(),
});

export const marketSchema = z.object({
  key: z.string(),
  last_update: z.string().optional(),
  outcomes: z.array(outcomeSchema),
});

export const bookmakerSchema = z.object({
  key: z.string(),
  title: z.string(),
  last_update: z.string().optional(),
  markets: z.array(marketSchema),
});

export const oddsEventSchema = eventSchema.extend({
  bookmakers: z.array(bookmakerSchema),
});
export const oddsResponseSchema = z.array(oddsEventSchema);
export type OddsEvent = z.infer<typeof oddsEventSchema>;
