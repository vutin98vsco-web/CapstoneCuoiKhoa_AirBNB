import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { bookingStore } from '../bookings/store.server.js';
import { createEmailStore } from './store.js';
import { siteUrl } from '../site.js';
import { reportServerError } from '../observability.js';
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
export const emailTokenHash = (token) =>
  typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
    ? createHash('sha256').update(token).digest('hex')
    : '';
let store;
export async function emailStore() {
  await bookingStore().health();
  return (store ||= createEmailStore({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    filename: resolve(
      /*turbopackIgnore: true*/ process.env.TNB_BOOKINGS_DB_PATH || '.data/tnbnb-bookings.sqlite',
    ),
    schema: process.env.TNB_DATABASE_SCHEMA || 'public',
  }));
}
export async function deliverEmails(onlyId) {
  if (!emailConfigured()) return;
  const db = await emailStore(),
    pending = onlyId ? [{ id: onlyId }] : await db.pending();
  for (const item of pending) {
    const job = await db.claim(item.id);
    if (!job) continue;
    if (job.payload.expiresAt && job.payload.expiresAt <= Date.now()) {
      await db.complete(job.id, job.lease, 'expired');
      continue;
    }
    let sent = false;
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': job.id,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [job.payload.to],
          subject: job.payload.subject,
          text: job.payload.text,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      });
      sent = response.ok;
      if (!sent) reportServerError('email.provider', { code: 'delivery_failed' });
    } catch {
      reportServerError('email.provider', { code: 'unavailable' });
    }
    await db.complete(job.id, job.lease, sent);
  }
}
export async function sendAccountEmail(user, purpose, locale = 'vi') {
  const db = await emailStore(),
    token = randomBytes(32).toString('hex'),
    hash = emailTokenHash(token),
    verify = purpose === 'verify',
    vi = locale !== 'en';
  const expiresAt = Date.now() + (verify ? 86400000 : 1800000);
  await db.issue(user.id, purpose, hash, expiresAt);
  const url = `${siteUrl()}/${verify ? 'xac-minh-email' : 'dat-lai-mat-khau'}?token=${token}&lang=${vi ? 'vi' : 'en'}`;
  const subject = verify
    ? vi
      ? 'TNbnb — Xác minh email'
      : 'TNbnb — Verify your email'
    : vi
      ? 'TNbnb — Khôi phục mật khẩu'
      : 'TNbnb — Reset your password';
  const text = `${subject}\n\n${url}\n\n${vi ? `Liên kết chỉ dùng một lần, hết hạn sau ${verify ? '24 giờ' : '30 phút'}. Nếu không yêu cầu, bạn có thể bỏ qua email này.` : `This single-use link expires in ${verify ? '24 hours' : '30 minutes'}. If you did not request it, ignore this email.`}`;
  const id = await db.enqueue(`${purpose}:${hash}`, { to: user.email, subject, text, expiresAt });
  await deliverEmails(id);
}
export async function queueBookingEmail(booking, locale = 'vi') {
  if (!emailConfigured()) return;
  const vi = locale !== 'en',
    subject = vi
      ? `TNbnb — Đã nhận yêu cầu ${booking.reference}`
      : `TNbnb — Request received ${booking.reference}`;
  return (await emailStore()).enqueue(`booking:${booking.id}`, {
    to: booking.email,
    subject,
    text: `${subject}\n\n${booking.snapshot.propertyName}\n${booking.checkin} — ${booking.checkout}\n\n${vi ? 'Đây là yêu cầu đã lưu, chưa phải xác nhận giữ phòng hoặc thanh toán.' : 'This is a saved request, not a confirmed reservation or payment.'}\n${siteUrl()}/chuyen-di`,
  });
}
