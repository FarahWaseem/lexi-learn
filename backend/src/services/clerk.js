const { clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');
const { createClerkClient, verifyToken } = require('@clerk/backend');
const { pool } = require('./db');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Helper function to add timeout to promises
 */
function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * يجلب/ينشئ مستخدم التطبيق ويرجّع UUID الداخلي
 * يربط مستخدم Clerk ببريد موجود سابقًا إن وجد.
 */
async function requireUser(req) {
  const auth = (req && req.auth) || getAuth(req) || {};
  const clerkId = auth.userId || auth.user_id;
  if (!clerkId) throw new Error("Auth required: missing Clerk userId");

  // Check if user already exists in DB (cached)
  const existingUser = await pool.query(
    `SELECT id, first_name, last_name, email FROM users WHERE clerk_user_id = $1`,
    [clerkId]
  );

  if (existingUser.rows.length > 0) {
    // User exists, update last_active and return
    await pool.query(
      `UPDATE users SET last_active = NOW() WHERE id = $1`,
      [existingUser.rows[0].id]
    );
    return existingUser.rows[0].id;
  }

  // User not in DB, create with placeholder data
  // We'll update with real data from Clerk in background
  console.log('⚡ Creating new user (fast path):', clerkId);
  
  const up = await pool.query(
    `INSERT INTO users (clerk_user_id, first_name, last_name, email, password_hash, is_active, last_active)
     VALUES ($1, $2, $3, $4, 'clerk_managed', TRUE, NOW())
     ON CONFLICT (clerk_user_id) DO UPDATE
       SET is_active=TRUE, last_active=NOW()
     RETURNING id;`,
    [clerkId, 'User', clerkId.substring(5, 10), `${clerkId}@clerk.temp`]
  );

  // Fetch real data from Clerk in background (non-blocking)
  setImmediate(async () => {
    try {
      const u = await withTimeout(clerkClient.users.getUser(clerkId), 5000);
      const email = u?.primaryEmailAddress?.emailAddress;
      const firstName = u?.firstName || "User";
      const lastName = u?.lastName || clerkId.substring(5, 10);
      
      if (email) {
        await pool.query(
          `UPDATE users 
           SET first_name=$1, last_name=$2, email=$3 
           WHERE clerk_user_id=$4`,
          [firstName, lastName, email, clerkId]
        );
        console.log('✅ User data updated from Clerk');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch Clerk user data:', err.message);
    }
  });

  return up.rows[0].id;
}

async function resolveUsername(userId) {
  try {
    const u = await withTimeout(clerkClient.users.getUser(userId), 5000);
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

