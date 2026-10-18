# Social pipeline: owner setup checklist

Do these in order. Each platform works on its own, so you can go live with Facebook and Instagram before TikTok and Google are approved. Platform rules were checked against the official docs on 2026-10-18. Platforms change them, so if a screen looks different, follow the platform's current instructions.

Where values go:

- **GitHub**: repository **Settings > Secrets and variables > Actions**. *Secrets* are hidden. *Variables* are plain settings like `DRY_RUN`.
- **Vercel**: Project **Settings > Environment Variables**. Only the webhook needs these.

A list of every name is in [`.env.example`](./.env.example).

## 1. Supabase (needed before anything goes live)

1. If the project is paused, open the Supabase dashboard and **Restore** it. Free projects pause after about a week with no activity.
2. Apply the migration `supabase/migrations/20261018000000_social_pipeline.sql`: SQL Editor > paste > Run, or `supabase db push`. It creates the `social_*` tables. Only the server key can read or write them; the website's public key can't.
3. In GitHub, add the secrets `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Use the server-side secret key (or the legacy `SUPABASE_SERVICE_ROLE_KEY`), never the publishable key.

Without Supabase the publisher only does dry runs. It refuses to publish for real, because Supabase is what guarantees a post goes out once.

## 2. Meta: Instagram + Facebook

The pipeline uses **Instagram API with Facebook Login**, so one Meta app and one Page token cover both.

1. Make sure Rent with Heldy has a **Facebook Page** (Meta Business Suite).
2. In the Instagram app, switch @rentwithheldy to a **Business** (or Creator) account and link it to the Facebook Page.
3. At [developers.facebook.com](https://developers.facebook.com), create an app (type **Business**). Add **Facebook Login for Business** and **Instagram**.
4. Request these permissions: `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`, `instagram_manage_messages`, `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`, `read_insights`, `business_management`.
   - **Publishing and insights**: Standard Access (no App Review) works for people who have a role on the app, which covers the owner using the business's own Page and Instagram.
   - **Webhooks for Instagram comments and mentions**: Meta's docs say these need **Advanced Access and Business Verification** and a **Live** app, even for your own account. Plan for Business Verification (Meta Business Settings > Security Center) if you want comments in Supabase. Publishing works without it.
5. Generate a **long-lived Page access token** (Graph API Explorer: get a user token with the permissions above, exchange it for a long-lived user token, then read `/me/accounts` for the Page token). Page tokens made this way don't expire unless the password or permissions change.
6. Find the IDs. `FB_PAGE_ID` is in the `/me/accounts` result. `IG_USER_ID` comes from `GET /{FB_PAGE_ID}?fields=instagram_business_account`.
7. Add the GitHub secrets `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN` and `IG_USER_ID`. `IG_ACCESS_TOKEN` is optional; the Page token is used when it's empty.
8. **Webhook** (for comments, mentions and DMs):
   1. In Vercel, add `META_APP_SECRET` (Meta app > Settings > Basic > App secret) and `META_WEBHOOK_VERIFY_TOKEN` (any long random string you make up). `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are already there for the site's other functions. Redeploy.
   2. In the Meta app's **Webhooks** settings, set the callback URL to `https://rentwithheldy.com/api/meta-webhook` and the verify token to the same random string.
   3. Subscribe to **Instagram**: `comments`, `mentions`, `messages`. Subscribe to **Page**: `feed`, `messages`.
   4. Connect the Page to the app: `POST /{FB_PAGE_ID}/subscribed_apps?subscribed_fields=feed,messages` with the Page token.

   Events land in Supabase `social_events`. Rental questions are tagged `inquiry`. Nothing is ever auto-replied.

## 3. TikTok

1. Create a TikTok Business account for Rent with Heldy if needed.
2. At [developers.tiktok.com](https://developers.tiktok.com), create an app with **Login Kit** and **Content Posting API** (turn on **Direct Post**). Scopes: `user.info.basic`, `user.info.stats` (follower count), `video.publish`, `video.list`.
3. **Verify the domain** `rentwithheldy.com` in the app's URL properties. TikTok then pulls videos straight from the site. After it's verified, set the GitHub variable `TIKTOK_PULL_FROM_URL=true`. Until then the publisher uploads the file directly, which works for videos stored in the repository.
4. Authorize the app once with the Rent with Heldy TikTok account (OAuth) to get a **refresh token**. Add the GitHub secrets `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` and `TIKTOK_REFRESH_TOKEN`.
   - Refresh tokens last 365 days, and TikTok may hand back a new one on each refresh. The pipeline saves the newest one in Supabase (`social_tokens`). The weekly **Social token check** job keeps it fresh. Without Supabase, the job warns when the token rotates and you need to re-authorize.
5. Submit the app for TikTok's **audit**. Until it's approved, TikTok only allows **private** posts (`SELF_ONLY`), and the account must be private when posting. The pipeline forces private posts until you set the GitHub variable `TIKTOK_AUDITED=true`.

## 4. Google Business Profile

1. Create a Google Cloud project. Enable **My Business Account Management API**, **My Business Business Information API**, **Business Profile Performance API** and **Google My Business API** (v4, used for posts and reviews).
2. Request API access through Google's **Business Profile API access request form**, giving your Cloud project number. Google requires the profile to be verified, active for 60+ days and to have a website. Approval can take weeks; until then the quota shows 0.
3. Create an **OAuth client** (type Web application). Authorize once, with `access_type=offline` and scope `https://www.googleapis.com/auth/business.manage`, using the Google account that manages the listing, to get a refresh token. The OAuth Playground works for this. Set the OAuth consent screen to **In production**: refresh tokens for apps left in *Testing* stop working after 7 days.
4. Find `GBP_ACCOUNT_ID` (Account Management API `accounts.list`) and `GBP_LOCATION_ID` (Business Information API `accounts.locations.list`) for **Rent with Heldy, 1 S Federal Hwy, Dania Beach, FL 33004**. Use only the numbers, without the `accounts/` or `locations/` prefixes.
5. Add the GitHub secrets `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN`, `GBP_ACCOUNT_ID` and `GBP_LOCATION_ID`. After Google approves access, set the GitHub variable `GBP_ENABLED=true`.

## 5. Optional failure emails

Add the GitHub secrets `RESEND_API_KEY` and `ALERT_EMAIL`. `RESEND_FROM_EMAIL` is optional; it must be on a domain verified in Resend. You get an email when a post fails for the last time.

## 6. Go live

1. Add the GitHub variables `DRY_RUN=true` and `SOCIAL_TIMEZONE=America/New_York`.
2. Merge a real, low-stakes post with `status: approved`. After its time, open **Actions > Social publish** and check that the summary shows the expected payloads and `dry_run` rows.
3. Set `DRY_RUN=false`. Publish one low-stakes post per platform and click each permalink in the summary.
4. Optional: run **Actions > Social analytics** by hand with `backfill_days: 30`.

## Good to know

- **Public repository.** Post files, captions and Actions logs are public. Secrets never appear in logs (they're redacted), but captions are visible from the moment the pull request opens.
- **GitHub turns off scheduled workflows** in a public repository after 60 days without any commits. If that happens, Actions shows a banner. Click **Enable workflow** (or push any commit).
- **Instagram limits.** Meta's docs state a daily cap of either 50 or 100 API-published posts; the pipeline checks the live number before each post.
- **Schedule precision.** GitHub runs the publisher about every 15 minutes, and busy periods can delay it. Expect posts within roughly 15 to 30 minutes of `scheduled_at`.

## Every variable

| Name | Where | Kind | Purpose |
| --- | --- | --- | --- |
| `DRY_RUN` | GitHub | variable | `true` by default; exactly `false` goes live |
| `SOCIAL_TIMEZONE` | GitHub | variable | `America/New_York` |
| `TIKTOK_AUDITED` | GitHub | variable | `true` only after TikTok approves the app |
| `TIKTOK_PULL_FROM_URL` | GitHub | variable | `true` after rentwithheldy.com is verified with TikTok |
| `GBP_ENABLED` | GitHub | variable | `true` only after Google approves API access |
| `SOCIAL_MEDIA_BASE_URL` | GitHub | variable | Optional; defaults to `https://rentwithheldy.com` |
| `META_GRAPH_VERSION` | GitHub | variable | Optional; defaults to `v26.0` |
| `SUPABASE_URL` | GitHub, Vercel | secret | Supabase project URL |
| `SUPABASE_SECRET_KEY` | GitHub, Vercel | secret | Server-side key (or `SUPABASE_SERVICE_ROLE_KEY`) |
| `META_APP_ID` | GitHub, Vercel | secret | Meta app; for your records (the jobs don't read it) |
| `META_APP_SECRET` | Vercel | secret | Webhook signature check |
| `META_WEBHOOK_VERIFY_TOKEN` | Vercel | secret | Random string for the webhook handshake |
| `FB_PAGE_ID` | GitHub | secret | Facebook Page id |
| `FB_PAGE_ACCESS_TOKEN` | GitHub | secret | Long-lived Page token |
| `IG_USER_ID` | GitHub | secret | Instagram professional account id |
| `IG_ACCESS_TOKEN` | GitHub | secret | Optional; the Page token is used when empty |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | GitHub | secret | TikTok app |
| `TIKTOK_REFRESH_TOKEN` | GitHub | secret | First refresh token; rotations are kept in `social_tokens` |
| `GBP_CLIENT_ID` / `GBP_CLIENT_SECRET` | GitHub | secret | Google OAuth client |
| `GBP_REFRESH_TOKEN` | GitHub | secret | Offline refresh token (`business.manage`) |
| `GBP_ACCOUNT_ID` / `GBP_LOCATION_ID` | GitHub | secret | Business Profile ids |
| `RESEND_API_KEY` / `ALERT_EMAIL` / `RESEND_FROM_EMAIL` | GitHub | secret | Optional failure emails |
