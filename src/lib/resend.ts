import { Resend } from "resend";
import { formatCurrency, formatDate } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = "noreply@bidforjunk.com";

export async function sendNewJobAlert(
  providerEmail: string,
  jobTitle: string,
  jobCity: string,
  estimatedPrice: number
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: providerEmail,
    subject: `New job posted in ${jobCity}: ${jobTitle}`,
    html: `
      <h1>New Job Alert</h1>
      <p>A new job has been posted in your service area:</p>
      <p><strong>${jobTitle}</strong></p>
      <p>Location: ${jobCity}</p>
      <p>Estimated budget: ${formatCurrency(estimatedPrice)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/jobs">View all jobs</a></p>
    `,
  });
}

export async function sendNewOfferAlert(
  customerEmail: string,
  providerName: string,
  jobTitle: string,
  offerPrice: number
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `New offer from ${providerName}`,
    html: `
      <h1>New Offer</h1>
      <p>${providerName} has submitted an offer for your job:</p>
      <p><strong>${jobTitle}</strong></p>
      <p>Offered price: ${formatCurrency(offerPrice)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard">Review offer</a></p>
    `,
  });
}

export async function sendOfferAccepted(
  providerEmail: string,
  customerName: string,
  jobTitle: string,
  agreedPrice: number
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: providerEmail,
    subject: `Your offer was accepted!`,
    html: `
      <h1>Offer Accepted</h1>
      <p>Your offer has been accepted by ${customerName}!</p>
      <p><strong>${jobTitle}</strong></p>
      <p>Agreed price: ${formatCurrency(agreedPrice)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/dashboard">Go to dashboard</a></p>
    `,
  });
}

export async function sendDispatchNotification(
  providerEmail: string,
  jobTitle: string,
  scheduledDate: string,
  timeWindow: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: providerEmail,
    subject: `Job dispatch: ${jobTitle}`,
    html: `
      <h1>Job Dispatch Notice</h1>
      <p>You have been assigned to the following job:</p>
      <p><strong>${jobTitle}</strong></p>
      <p>Scheduled: ${formatDate(scheduledDate)} ${timeWindow}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/dashboard">View details</a></p>
    `,
  });
}

export async function sendJobCompleteNotification(
  customerEmail: string,
  providerName: string,
  jobTitle: string
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `Job completed: ${jobTitle}`,
    html: `
      <h1>Work Completed</h1>
      <p>${providerName} has marked the following job as complete:</p>
      <p><strong>${jobTitle}</strong></p>
      <p>Please confirm the work was completed satisfactorily.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard">Confirm completion</a></p>
    `,
  });
}
