const resendEndpoint = 'https://api.resend.com/emails';

function requireEmailConfig(recipient) {
  const from = process.env.EMAIL_FROM;
  const to = recipient ?? process.env.ALERT_EMAIL_TO;

  if (!from || !to) {
    const error = new Error('EMAIL_FROM y el destinatario son requeridos para enviar correos.');
    error.statusCode = 500;
    throw error;
  }

  return { from, to };
}

export async function sendEmail({ to: recipient, subject, html, text }) {
  const provider = process.env.EMAIL_PROVIDER ?? 'mock';
  const { from, to } = requireEmailConfig(recipient);

  if (!subject || (!html && !text)) {
    const error = new Error('Subject y contenido son requeridos para enviar el correo.');
    error.statusCode = 400;
    throw error;
  }

  if (provider === 'mock') {
    return {
      provider,
      external_id: `mock_${Date.now()}`,
      delivered: true,
      to,
      subject,
    };
  }

  if (provider !== 'resend') {
    const error = new Error('EMAIL_PROVIDER debe ser "mock" o "resend".');
    error.statusCode = 500;
    throw error;
  }

  if (!process.env.RESEND_API_KEY) {
    const error = new Error('RESEND_API_KEY es requerido cuando EMAIL_PROVIDER=resend.');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(resendEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message ?? 'Resend rechazo el envio del correo.');
    error.statusCode = 502;
    error.providerResponse = payload;
    throw error;
  }

  return {
    provider,
    external_id: payload.id,
    delivered: true,
    to,
    subject,
  };
}

export async function sendInventoryAlert({ subject, html, text }) {
  return sendEmail({ subject, html, text });
}
