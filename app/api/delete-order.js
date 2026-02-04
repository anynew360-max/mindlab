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

const normalizeBody = (req) => {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    getAdminApp();
    const firestore = admin.firestore();
    const { firestoreId } = normalizeBody(req);

    if (!firestoreId) {
      return res.status(400).json({ ok: false, error: 'Missing firestoreId' });
    }

    await firestore.collection('orders').doc(String(firestoreId)).delete();

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete order:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to delete order',
    });
  }
}
