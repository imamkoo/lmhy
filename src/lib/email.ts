export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  ok: boolean;
  skipped: boolean;
  error?: string;
}

async function sendViaResend(
  apiKey: string,
  from: string,
  message: EmailMessage
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    return { ok: false, error: `Resend HTTP ${res.status}: ${errorBody}` };
  }
  return { ok: true };
}

async function sendViaBrevo(
  apiKey: string,
  from: string,
  message: EmailMessage
): Promise<{ ok: boolean; error?: string }> {
  const senderMatch = from.match(/^(.*?)\s*<(.+?)>$/);
  const senderName = senderMatch ? senderMatch[1].trim() : "Let Me Hear You";
  const senderEmail = senderMatch ? senderMatch[2].trim() : from;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    return { ok: false, error: `Brevo HTTP ${res.status}: ${errorBody}` };
  }
  return { ok: true };
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const fromEmail =
    process.env.EMAIL_FROM || "Let Me Hear You <halo@letmehearyou.com>";

  if (!resendKey && !brevoKey) {
    return {
      ok: false,
      skipped: true,
      error: "Provider email belum dikonfigurasi.",
    };
  }

  const sendOnce = async () => {
    if (resendKey) {
      return sendViaResend(resendKey, fromEmail, message);
    }
    return sendViaBrevo(brevoKey!, fromEmail, message);
  };

  try {
    let result = await sendOnce();
    if (!result.ok) {
      // 1x retry after 500ms
      await new Promise((r) => setTimeout(r, 500));
      result = await sendOnce();
    }

    if (!result.ok) {
      return { ok: false, skipped: false, error: result.error };
    }
    return { ok: true, skipped: false };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Gagal mengirim email.",
    };
  }
}
