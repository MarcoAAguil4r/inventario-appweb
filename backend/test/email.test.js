import test from 'node:test';
import assert from 'node:assert/strict';
import { sendEmail } from '../src/services/email.js';

test('mock email no exige configuracion de remitente ni destinatario real', async () => {
  const previousProvider = process.env.EMAIL_PROVIDER;
  const previousFrom = process.env.EMAIL_FROM;
  const previousTo = process.env.ALERT_EMAIL_TO;

  delete process.env.EMAIL_FROM;
  delete process.env.ALERT_EMAIL_TO;
  process.env.EMAIL_PROVIDER = 'mock';

  try {
    const result = await sendEmail({
      subject: 'Prueba',
      text: 'Contenido de prueba',
    });

    assert.equal(result.provider, 'mock');
    assert.equal(result.delivered, true);
    assert.equal(result.to, 'mock-alert@example.com');
  } finally {
    if (previousProvider === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = previousProvider;

    if (previousFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = previousFrom;

    if (previousTo === undefined) delete process.env.ALERT_EMAIL_TO;
    else process.env.ALERT_EMAIL_TO = previousTo;
  }
});
