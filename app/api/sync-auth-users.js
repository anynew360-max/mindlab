import admin from 'firebase-admin';

const getServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  }
  try {
    if (raw.trim().startsWith('{')) {
      return JSON.parse(raw);
    }
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
  }
};

const getAdminApp = () => {
  if (admin.apps.length) return admin.app();
  const serviceAccount = getServiceAccount();
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    getAdminApp();
    const auth = admin.auth();
    const firestore = admin.firestore();
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    let pageToken = undefined;
    let total = 0;
    do {
      const result = await auth.listUsers(1000, pageToken);
      const batch = firestore.batch();
      result.users.forEach((userRecord) => {
        const email = userRecord.email || '';
        const createdAt = userRecord.metadata?.creationTime
          ? new Date(userRecord.metadata.creationTime).toISOString()
          : new Date().toISOString();
        const payload = {
          id: userRecord.uid,
          uid: userRecord.uid,
          name: userRecord.displayName || '',
          email,
          phone: userRecord.phoneNumber || '',
          address: '',
          isAdmin: adminEmails.includes(email),
          profileImage: userRecord.photoURL || '',
          createdAt,
          createdAtServer: admin.firestore.FieldValue.serverTimestamp(),
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const ref = firestore.collection('users').doc(userRecord.uid);
        batch.set(ref, payload, { merge: true });
      });

      if (result.users.length) {
        await batch.commit();
      }

      total += result.users.length;
      pageToken = result.pageToken;
    } while (pageToken);

    return res.json({ ok: true, count: total });
  } catch (error) {
    console.error('Failed to sync auth users:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to sync users',
    });
  }
}
