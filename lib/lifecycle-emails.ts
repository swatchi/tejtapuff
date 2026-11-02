import "server-only";
import { euros, PRICE_SENTENCE, PRICING, WEEKLY } from "@/config/pricing";
import {
  cancellationEmail,
  firstRenewalReminderEmail,
  paymentFailedEmail,
  welcomeEmail,
} from "@/content/emails";
import { formatDayFr } from "@/lib/dates";
import { siteUrl } from "@/lib/env";
import { sendEmailLogged, sendEmailOnce } from "@/lib/notify";

export function sendWelcome(p: { userId: string; email: string; firstRenewalAt: string | null }) {
  return sendEmailOnce({
    kind: "welcome",
    ref: p.userId,
    to: p.email,
    userId: p.userId,
    content: welcomeEmail({
      appUrl: `${siteUrl()}/app`,
      priceSentence: PRICE_SENTENCE,
      weekly: WEEKLY,
      firstRenewalDate: formatDayFr(p.firstRenewalAt),
      reminderHours: PRICING.reminderHoursBeforeFirstRenewal,
    }),
  });
}

export function sendFirstRenewalReminder(p: { subscriptionId: string; userId: string; email: string; renewalAt: string; priceCents: number | null }) {
  return sendEmailOnce({
    kind: "first_renewal_reminder",
    ref: p.subscriptionId,
    to: p.email,
    userId: p.userId,
    content: firstRenewalReminderEmail({
      accountUrl: `${siteUrl()}/app/compte`,
      weekly: euros(p.priceCents ?? PRICING.weeklyCents),
      date: formatDayFr(p.renewalAt),
    }),
  });
}

export function sendPaymentFailed(p: { invoiceId: string; userId: string; email: string; amountCents: number }) {
  return sendEmailOnce({
    kind: "payment_failed",
    ref: p.invoiceId,
    to: p.email,
    userId: p.userId,
    content: paymentFailedEmail({ accountUrl: `${siteUrl()}/app/compte`, amount: euros(p.amountCents) }),
  });
}

export function sendCancellation(p: { userId: string; email: string; accessUntil: string | null }) {
  return sendEmailLogged({
    kind: "cancellation",
    to: p.email,
    userId: p.userId,
    content: cancellationEmail({ appUrl: `${siteUrl()}/app`, accessUntil: formatDayFr(p.accessUntil) }),
  });
}
