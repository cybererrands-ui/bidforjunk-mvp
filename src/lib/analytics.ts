interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  if (typeof window === "undefined") return;

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event);
  }

  // Send to analytics service (placeholder for future integration)
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || Date.now(),
      }),
    });
  } catch {
    // Silently fail analytics calls
  }
}

export function trackPageView(pageName: string): void {
  trackEvent({
    event: "page_view",
    properties: { page: pageName },
  });
}

export function trackButtonClick(
  buttonName: string,
  context?: Record<string, unknown>
): void {
  trackEvent({
    event: "button_click",
    properties: { button: buttonName, ...context },
  });
}

export function trackFormSubmit(
  formName: string,
  context?: Record<string, unknown>
): void {
  trackEvent({
    event: "form_submit",
    properties: { form: formName, ...context },
  });
}
