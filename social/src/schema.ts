// Frontmatter schema for social/posts/*.md. post.schema.json mirrors this
// for editors; this zod schema is what the pipeline enforces.

import { z } from "zod";

export const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const isoWithOffset = (field: string) =>
  z
    .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a quoted or plain ISO 8601 string` })
    .regex(ISO_WITH_OFFSET, `${field} must be ISO 8601 with a timezone offset, e.g. 2026-10-25T10:00:00-04:00`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `${field} is not a real date/time`);

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "must be an https:// URL");

export const INSTAGRAM_TYPES = ["feed", "reel", "story", "carousel"] as const;
export const FACEBOOK_TYPES = ["photo", "video", "link", "text"] as const;
export const TIKTOK_PRIVACY = ["SELF_ONLY", "PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR"] as const;
export const GBP_TYPES = ["STANDARD", "EVENT", "OFFER"] as const;
export const GBP_CTAS = ["BOOK", "ORDER", "SHOP", "LEARN_MORE", "SIGN_UP", "CALL"] as const;

const gbpEvent = z
  .object({
    title: z.string().min(1).max(58),
    start: isoWithOffset("platforms.gbp.event.start"),
    end: isoWithOffset("platforms.gbp.event.end"),
  })
  .strict();

export const PlatformsSchema = z
  .object({
    instagram: z
      .object({
        type: z.enum(INSTAGRAM_TYPES),
        // Reels also appear on the profile grid unless this is false.
        share_to_feed: z.boolean().optional(),
      })
      .strict()
      .optional(),
    facebook: z.object({ type: z.enum(FACEBOOK_TYPES) }).strict().optional(),
    tiktok: z
      .object({
        type: z.literal("video"),
        privacy: z.enum(TIKTOK_PRIVACY).default("SELF_ONLY"),
        disable_comment: z.boolean().default(false),
        disable_duet: z.boolean().default(false),
        disable_stitch: z.boolean().default(false),
      })
      .strict()
      .optional(),
    gbp: z
      .object({
        type: z.enum(GBP_TYPES),
        cta: z.enum(GBP_CTAS).optional(),
        event: gbpEvent.optional(),
        offer: z
          .object({
            coupon_code: z.string().max(58).optional(),
            redeem_url: httpsUrl.optional(),
            terms: z.string().max(5000).optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const FrontmatterSchema = z
  .object({
    id: z.string().regex(KEBAB, "id must be kebab-case (a-z, 0-9, single hyphens)").max(120),
    status: z.enum(["draft", "approved", "cancelled"]),
    scheduled_at: isoWithOffset("scheduled_at"),
    platforms: PlatformsSchema.default({}),
    media: z.array(z.string().min(1)).default([]),
    link: httpsUrl.optional(),
    utm_campaign: z.string().regex(KEBAB, "utm_campaign must be kebab-case").max(100).optional(),
    overrides: z
      .object({
        instagram: z.string().min(1).optional(),
        facebook: z.string().min(1).optional(),
        tiktok: z.string().min(1).optional(),
        gbp: z.string().min(1).optional(),
      })
      .strict()
      .default({}),
  })
  .strict();

export type Frontmatter = z.infer<typeof FrontmatterSchema>;
export type PlatformSettings = z.infer<typeof PlatformsSchema>;
