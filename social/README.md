# Social posts: how it works

Posts for Instagram, Facebook, TikTok and Google Business Profile are written as files in this folder. **Merging a pull request is the approval.** A scheduled job then publishes each approved post at its time, using each platform's official API.

Nothing can publish unless all of these are true:

1. The post file is merged into `main`.
2. Its `status` is `approved`.
3. Its `scheduled_at` time has passed (and is less than 48 hours ago).
4. The repository variable `DRY_RUN` is set to exactly `false`.

Until then the job only logs what it *would* send.

> This repository is public. Post files, draft captions and the Actions logs can be seen by anyone, before and after publishing. Don't put anything in a post file you wouldn't want seen early.

## Adding a post

1. Add the photo or video to `public/social-media/`. Real, owned photos only, never AI images. Name it after the post, e.g. `2026-11-01-cruise-pickup.jpg`.
   - Instagram photos must be **JPEG**, under 8 MB, between 4:5 (portrait) and 1.91:1 (landscape). 1080 × 1350 works well.
   - Videos: MP4 or MOV. Files over about 50 MB should go somewhere else (an `https://` link) because they make the repository heavy. GitHub refuses files over 100 MB.
2. Copy `posts/_example-draft.md` to `posts/<date>-<short-name>.md`. The `id` inside must match the file name, without `.md`.
3. Fill in the frontmatter (the part between the `---` lines) and write the caption below it.
4. Set `status: approved` when it's ready, and open a pull request. The **Social validate** check tells you about any problems. Warnings (like an em dash) don't block. Errors do.
5. Merge to approve. The site redeploys in a minute or two, which makes the photo public. The publisher waits for that before posting.

To cancel a post that's merged but not yet published, change `status` to `cancelled` (or back to `draft`) and merge that change.

### The fields

| Field | What it means |
| --- | --- |
| `id` | Same as the file name. Never change it after a post is published. |
| `status` | `draft`, `approved` or `cancelled`. |
| `scheduled_at` | Date and time **with the offset**. Use `-04:00` for daylight time (mid-March to early November) and `-05:00` for standard time. For example, `2026-10-25T10:00:00-04:00` is 10 AM in Florida. |
| `platforms` | One block per platform (see below). Leave a platform out to skip it. |
| `media` | List of files in `public/social-media/` or `https://` links. |
| `link` | The page on rentwithheldy.com to send people to. UTM tags are added automatically. |
| `utm_campaign` | A short campaign name, like `fll-delivery-oct`. Defaults to the post id. |
| `overrides` | A different caption for one platform, for example a shorter one for Google. |

Platform types:

- **instagram**: `feed` (1 photo, or 1 video posted as a Reel), `carousel` (2 to 10 photos/videos), `reel` (1 video), `story` (1 photo or video; stories have no caption).
- **facebook**: `photo` (1 photo), `video` (1 video), `link` (link preview, needs `link`), `text`.
- **tiktok**: `video` (exactly 1 video). Posts are **private** (only visible to the account) until TikTok approves the app.
- **gbp** (Google): `STANDARD`, `EVENT` or `OFFER`, plus a button: `cta: BOOK`, `LEARN_MORE`, `CALL` and so on. Events and offers need an `event:` block with `title`, `start` and `end`.

### Links

Instagram and TikTok captions can't hold clickable links. Each publish run lists the UTM link for those posts in the job summary under **Link-in-bio URLs**, so the link in bio can be updated for the campaign. Facebook and Google get the UTM link automatically.

## Content rules (checked in review)

- Real, owned photos only. No AI-generated images or video.
- No invented prices, discounts, testimonials or availability.
- Customer photos only with documented consent.
- Brand voice: warm, practical, short sentences. Say "guests", not "customers". **No em dashes** (the validator warns about them).
- Never recolor, stretch or redraw the logo.

## Where to see what happened

- **GitHub > Actions > Social publish**: each run has a summary table with every post, platform, result and permalink. Failures also email `ALERT_EMAIL` if it's set up.
- **Supabase**: `social_publications` (one row per post and platform), `social_events` (comments, mentions, DMs and Google reviews waiting for a reply), `social_metrics_daily` and `social_post_metrics` (nightly numbers).

### When something fails

- A post that fails is retried twice more (after 15 and then 30 minutes). After 3 failures it stops and shows under **Needs attention**.
- If a publish request timed out, the post *may* have gone out, so it is **never retried automatically**. Check the account. If the post isn't there, delete that row in `social_publications` and the next run will try again.
- To stop a post on one platform for good, set that row's `state` to `skipped` in Supabase.
- If you edit a post after it was published, it is **not** re-posted. The run notes it under **Needs attention**.

## Manual runs

**Actions > Social publish > Run workflow** has two options:

- `dry_run` (on by default): only logs what would be sent.
- `post_id`: run just one post. A dry run with a `post_id` shows that post's payloads without recording anything. This also lets you publish a post that is more than 48 hours late.

## For developers

- Code: `social/src`. Tests: `social/test`. Run them with `npx vitest run social/test`.
- `npm run social:validate`, `social:publish`, `social:analytics`, `social:refresh-tokens`, `social:typecheck`.
- With no secrets set, every job logs `skipped: not configured` and exits cleanly.
- Owner setup and every environment variable: [SETUP.md](./SETUP.md).
