const { clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');
const { createClerkClient, verifyToken } = require('@clerk/backend');
const { pool } = require('./db');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * يجلب/ينشئ مستخدم التطبيق ويرجّع UUID الداخلي
 * يربط مستخدم Clerk ببريد موجود سابقًا إن وجد.
 */
async function requireUser(req) {
  const auth = (req && req.auth) || getAuth(req) || {};
  const clerkId = auth.userId || auth.user_id;
  if (!clerkId) throw new Error("Auth required: missing Clerk userId");

  const u = await clerkClient.users.getUser(clerkId);
  const email = u?.primaryEmailAddress?.emailAddress;
  const firstName = u?.firstName || "Clerk";
  const lastName = u?.lastName || "User";
  if (!email) throw new Error("Auth required: missing primary email");

  await pool.query(
    `UPDATE users SET clerk_user_id=$1
     WHERE email=$2 AND (clerk_user_id IS NULL OR clerk_user_id='')`,
    [clerkId, email]
  );

  const up = await pool.query(
    `INSERT INTO users (clerk_user_id, first_name, last_name, email, password_hash, is_active, last_active)
     VALUES ($1,$2,$3,$4,'clerk_managed', TRUE, NOW())
     ON CONFLICT (clerk_user_id) DO UPDATE
       SET first_name=EXCLUDED.first_name,
           last_name=EXCLUDED.last_name,
           email=EXCLUDED.email,
           is_active=TRUE,
           last_active=NOW()
     RETURNING id;`,
    [clerkId, firstName, lastName, email]
  );

  return up.rows[0].id;
}

async function resolveUsername(userId) {
  try {
    const u = await clerkClient.users.getUser(userId);
    return (
      u?.username ||
      [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() ||
      u?.primaryEmailAddress?.emailAddress ||
      'User'
    );
  } catch {
    return 'User';
  }
}

/**
 * Dev helper (WS فقط عند SKIP_WS_AUTH=1)
 */
async function getOrCreateDevUser() {
  const email = "dev@local";
  const sel = await pool.query(`SELECT id FROM users WHERE email=$1 LIMIT 1`, [email]);
  if (sel.rows && sel.rows[0]) return { id: sel.rows[0].id };
  const ins = await pool.query(
    `INSERT INTO users (first_name,last_name,email,password_hash, is_active, last_active)
     VALUES ('Dev','User',$1,'clerk_managed', TRUE, NOW()) RETURNING id;`,
    [email]
  );
  return { id: ins.rows[0].id };
}

module.exports = {
  clerkMiddleware,
  requireAuth,
  getAuth,
  clerkClient,
  verifyToken,
  requireUser,
  resolveUsername,
  getOrCreateDevUser,
};

