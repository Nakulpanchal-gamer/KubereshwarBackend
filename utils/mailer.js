// src/utils/mailer.js
const { Resend } = require('resend');

const enableDebug = process.env.EMAIL_DEBUG === 'true';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('[Email] WARNING: RESEND_API_KEY is not set. Email functionality will not work.');
}
const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (enableDebug) {
  console.log('[Email] Resend configured', {
    apiKey: process.env.RESEND_API_KEY ? '***' : '(missing)',
    fromEmail: process.env.RESEND_FROM_EMAIL || process.env.MAIL_FROM,
    fromName: process.env.MAIL_FROM_NAME || 'Kubereshwar Website',
  });
}

async function sendEnquiryEmail({
  to,
  fromEmail,
  fromName,
  message,

  // enriched fields
  phone,
  topic,
  consent,
  categoryId,
  categoryName,
  allProductsOfCategory = false,
  productNames = [],      // array of strings
  productIds = [],        // array of strings
  product,                // legacy single { name }
  meta = {},              // { receivedAt, ip, ua }

  subject: customSubject,
  attachments = []
}) {
  const productPart =
    allProductsOfCategory
      ? '• Entire category'
      : productNames?.length
        ? `• ${productNames.length} product(s)`
        : product?.name
          ? `• ${product.name}`
          : '';

  const subject = customSubject
    || ['New enquiry', categoryName && `• ${categoryName}`, productPart, '•', fromName]
         .filter(Boolean).join(' ');

  const receivedAt = meta.receivedAt ? new Date(meta.receivedAt) : new Date();
  const details = [
    ['Name', fromName],
    ['Email', htmlMailto(fromEmail)],
    ['Phone', phone ? htmlTel(phone) : '—'],
    ['Category', categoryName ? escapeHtml(categoryName) : '—'],
    ['Category ID', categoryId || '—'],
    ['Products',
      allProductsOfCategory
        ? badge('Entire category')
        : productNames?.length
          ? bulletList(productNames)
          : (product?.name ? escapeHtml(product.name) : '—')
    ],
    ['Received At', escapeHtml(receivedAt.toISOString())],
  ];

  const html = `
    <div style="font:14px/1.6 -apple-system,Segoe UI,Roboto,Arial;color:#111">
      <h2 style="margin:0 0 12px;font-size:18px;">${escapeHtml(customSubject || 'New enquiry received')}</h2>

      <table role="presentation" cellspacing="0" cellpadding="0"
             style="border-collapse:collapse;width:100%;max-width:720px;border:1px solid #eee;border-radius:8px;overflow:hidden">
        <tbody>
          ${details.map(([k,v]) => row(k, v)).join('')}
        </tbody>
      </table>

      <p style="margin:18px 0 6px;font-weight:600;">Message</p>
      <pre style="white-space:pre-wrap;background:#f6f7f8;padding:12px;border-radius:6px;border:1px solid #eee;margin:0;">
${escapeHtml(message || '')}
      </pre>

      <p style="margin:18px 0 0;font-size:12px;color:#6b7280;">
        Reply: <a href="mailto:${escapeAttr(fromEmail)}">${escapeHtml(fromEmail)}</a>
        ${phone ? ' · Call: ' + htmlTel(phone) : ''}
      </p>
    </div>
  `;

  const text = [
    `New enquiry received`,
    '',
    `Name: ${fromName}`,
    `Email: ${fromEmail}`,
    `Phone: ${phone || '—'}`,
    `Topic: ${topic || '—'}`,
    `Category: ${categoryName || '—'}`,
    `Category ID: ${categoryId || '—'}`,
    `Products: ${
      allProductsOfCategory ? 'Entire category'
        : (productNames?.length ? productNames.join(', ')
          : (product?.name || '—'))
    }`,
    `Consent: ${typeof consent === 'boolean' ? (consent ? 'Yes' : 'No') : '—'}`,
    `Received At: ${receivedAt.toISOString()}`,
    `IP: ${meta.ip || '—'}`,
    `User Agent: ${meta.ua || '—'}`,
    '',
    `Message:`,
    message || ''
  ].join('\n');

  // Use onboarding@resend.dev for testing (pre-verified) or verified email from env
  const fromEmailAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromNameDisplay = process.env.MAIL_FROM_NAME || 'Kubereshwar Website';

  if (!resend) {
    throw new Error('Resend API key is not configured. Please set RESEND_API_KEY in your environment variables.');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromNameDisplay} <${fromEmailAddress}>`,
      to: [to],
      replyTo: fromEmail,
      subject,
      html,
      text,
      // Note: Resend attachments require different format
      // attachments: attachments.length > 0 ? attachments.map(att => ({
      //   filename: att.filename,
      //   content: att.content,
      //   contentType: att.contentType
      // })) : undefined
    });

    if (error) {
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    if (enableDebug) {
      console.log('[Email] Sent successfully:', data?.id);
    }

    return { messageId: data?.id, success: true };
  } catch (err) {
    if (enableDebug) {
      console.error('[Email] Send failed:', err.message);
    }
    throw err;
  }
}

async function sendSystemEmail({ to, subject, html, text }) {
  // Use onboarding@resend.dev for testing (pre-verified) or verified email from env
  const fromEmailAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const fromNameDisplay = process.env.MAIL_FROM_NAME || 'Kubereshwar Website';

  if (!resend) {
    throw new Error('Resend API key is not configured. Please set RESEND_API_KEY in your environment variables.');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromNameDisplay} <${fromEmailAddress}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    if (enableDebug) {
      console.log('[Email] System email sent successfully:', data?.id);
    }

    return { messageId: data?.id, success: true };
  } catch (err) {
    if (enableDebug) {
      console.error('[Email] System email send failed:', err.message);
    }
    throw err;
  }
}

/* ---------- helpers ---------- */
function row(key, val) {
  const v = (typeof val === 'string') ? val : (val ?? '—');
  return `
    <tr>
      <td style="background:#fafafa;border-bottom:1px solid #eee;padding:10px 12px;width:180px;font-weight:600;">${escapeHtml(key)}</td>
      <td style="border-bottom:1px solid #eee;padding:10px 12px;">${v}</td>
    </tr>`;
}
function badge(text) {
  return `<span style="display:inline-block;background:#eef6ff;color:#1e40af;border:1px solid #c7e0ff;border-radius:999px;padding:2px 8px;font-size:12px;">${escapeHtml(text)}</span>`;
}
function bulletList(items = []) {
  return `<ul style="margin:0;padding-left:18px">${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}
function htmlMailto(addr) {
  return `<a href="mailto:${escapeAttr(addr)}">${escapeHtml(addr)}</a>`;
}
function htmlTel(num) {
  const clean = String(num);
  return `<a href="tel:${escapeAttr(clean)}">${escapeHtml(clean)}</a>`;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}
function escapeAttr(s = '') {
  return String(s).replace(/"/g,'&quot;');
}

module.exports = { sendEnquiryEmail, sendSystemEmail };
