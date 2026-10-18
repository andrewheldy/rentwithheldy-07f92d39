// Google Business Profile local posts (v4, still supported per Google's
// sunset page as of 2026-08):
//   POST https://mybusiness.googleapis.com/v4/accounts/{a}/locations/{l}/localPosts
// API access needs Google's approval; until GBP_ENABLED=true this is skipped.

import type { GbpConfig } from "../config.js";
import { requestJson } from "../http.js";
import type { SocialPost } from "../load-posts.js";
import { buildLink } from "../utm.js";
import { irreversible, type PlatformPublisher, type PublisherDeps } from "./types.js";

/** Splits an ISO timestamp into Google's Date/TimeOfDay in the business's timezone. */
export function googleDateTime(iso: string, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return {
    date: { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) },
    time: { hours: Number(parts.hour), minutes: Number(parts.minute), seconds: 0, nanos: 0 },
  };
}

export function gbpLocalPost(post: SocialPost, timeZone: string) {
  const settings = post.platforms.gbp!;
  const utmLink = post.link ? buildLink(post.link, { source: "gbp", campaign: post.utmCampaign, content: post.id }) : null;
  const cta = settings.cta ?? (utmLink ? "LEARN_MORE" : null);
  const body: Record<string, unknown> = {
    languageCode: "en-US",
    summary: post.captions.gbp,
    topicType: settings.type,
  };
  if (cta) body.callToAction = cta === "CALL" ? { actionType: "CALL" } : { actionType: cta, url: utmLink };
  const photo = post.media.find((item) => item.kind === "image");
  if (photo) body.media = [{ mediaFormat: "PHOTO", sourceUrl: photo.publicUrl }];
  if (settings.event) {
    const start = googleDateTime(settings.event.start, timeZone);
    const end = googleDateTime(settings.event.end, timeZone);
    body.event = {
      title: settings.event.title,
      schedule: { startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time },
    };
  }
  if (settings.type === "OFFER" && settings.offer) {
    body.offer = {
      ...(settings.offer.coupon_code ? { couponCode: settings.offer.coupon_code } : {}),
      ...(settings.offer.redeem_url ? { redeemOnlineUrl: settings.offer.redeem_url } : {}),
      ...(settings.offer.terms ? { termsConditions: settings.offer.terms } : {}),
    };
  }
  return body;
}

export function createGbpPublisher(
  config: GbpConfig | null,
  enabledFlag: boolean,
  tokens: { accessToken(): Promise<string> } | null,
  timeZone: string,
  deps: PublisherDeps,
): PlatformPublisher {
  const endpoint = config
    ? `https://mybusiness.googleapis.com/v4/accounts/${config.accountId}/locations/${config.locationId}/localPosts`
    : "https://mybusiness.googleapis.com/v4/accounts/{GBP_ACCOUNT_ID}/locations/{GBP_LOCATION_ID}/localPosts";

  return {
    platform: "gbp",
    notConfiguredReason() {
      if (!enabledFlag) return "GBP_ENABLED is not true (waiting on Google Business Profile API approval)";
      if (!config || !tokens) return "GBP_CLIENT_ID / GBP_CLIENT_SECRET / GBP_REFRESH_TOKEN / GBP_ACCOUNT_ID / GBP_LOCATION_ID are not all set";
      return null;
    },
    preview(post) {
      return { endpoint: `POST ${endpoint}`, body: gbpLocalPost(post, timeZone) };
    },
    async publish(post) {
      const token = await tokens!.accessToken();
      const response = await irreversible("gbp localPosts.create", () =>
        requestJson(deps.fetch, endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: gbpLocalPost(post, timeZone),
        }),
      );
      return {
        platformPostId: String(response.name),
        permalink: response.searchUrl ?? null,
        note: response.state && response.state !== "LIVE" ? `Google state: ${response.state}` : undefined,
      };
    },
  };
}
