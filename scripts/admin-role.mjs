import { bookingStore } from '../lib/bookings/store.server.js';
import { normalizeEmail, validEmail } from '../lib/auth/validation.js';
const args = process.argv.slice(2), email = normalizeEmail(args[args.indexOf('--email')+1]), role = args.includes('--revoke') ? 'user' : 'admin';
if (!args.includes('--email') || !validEmail(email)) { console.error('Usage: npm run admin:grant -- --email owner@example.com [--revoke]'); process.exitCode = 1; }
else {
  const db = bookingStore();
  try { const user = db.accounts.byEmail(email); if (!user) throw new Error('Account not found. Register in TNbnb first; this tool never creates accounts or passwords.'); db.workspace.bootstrapRole(user.id,role); console.log(JSON.stringify({ ok: true,role,accountId: user.id,signInAgain: true })); }
  catch (error) { console.error(error.code || error.message); process.exitCode = 1; }
  finally { db.close(); }
}
