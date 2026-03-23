import { Resend } from "resend";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateAgreementHtml } from "@/lib/agreement-text";

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

export interface ServiceAgreementEmailParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  providerName: string;
  providerEmail: string;
  jobTitle: string;
  jobDescription: string;
  jobCity: string;
  jobState: string;
  junkTypes: string[];
  agreedPriceCents: number;
  date: string;
}

export async function sendServiceAgreement(
  params: ServiceAgreementEmailParams
): Promise<void> {
  const agreementHtml = generateAgreementHtml({
    customerName: params.customerName,
    providerName: params.providerName,
    jobTitle: params.jobTitle,
    jobDescription: params.jobDescription,
    jobCity: params.jobCity,
    jobState: params.jobState,
    junkTypes: params.junkTypes,
    agreedPriceCents: params.agreedPriceCents,
    date: params.date,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bidforjunk.com";

  // Email to Provider: agreement + customer contact details + next steps
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.providerEmail,
    subject: `Service Agreement: ${params.jobTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Offer Accepted!</h1>
        <p>${params.customerName} has accepted your offer for <strong>${params.jobTitle}</strong>.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #166534;">Customer Contact Details</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${params.customerName}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${params.customerEmail}</p>
          ${params.customerPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${params.customerPhone}</p>` : ""}
        </div>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">What to do next</h3>
          <ol style="margin: 0; padding-left: 20px; color: #555;">
            <li>Contact the customer within 24 hours to schedule an on-site visit</li>
            <li>Inspect the items on-site and confirm the final price</li>
            <li>Complete the work as agreed</li>
          </ol>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <h2 style="font-size: 18px; color: #333;">Service Agreement</h2>
        ${agreementHtml}

        <p style="margin-top: 24px;"><a href="${appUrl}/provider/dashboard" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Go to Dashboard</a></p>
      </div>
    `,
  });

  // Email to Customer: agreement confirmation + what happens next
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.customerEmail,
    subject: `Service Agreement Confirmed: ${params.jobTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Agreement Confirmed</h1>
        <p>You have accepted an offer from <strong>${params.providerName}</strong> for your job <strong>${params.jobTitle}</strong>.</p>
        <p>Your contact details have been shared with the provider.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #166534;">What happens next</h3>
          <ol style="margin: 0; padding-left: 20px; color: #555;">
            <li>The provider will contact you within 24 hours to schedule an on-site visit</li>
            <li>They will inspect the items and confirm the final price on-site</li>
            <li>You can accept the final price or cancel at no charge</li>
          </ol>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <h2 style="font-size: 18px; color: #333;">Your Service Agreement</h2>
        ${agreementHtml}

        <p style="margin-top: 24px;"><a href="${appUrl}/customer/dashboard" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Go to Dashboard</a></p>
      </div>
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
