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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    getAdminApp();
    const firestore = admin.firestore();
    const snapshot = await firestore.collection('orders').orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map((doc) => ({
      firestoreId: doc.id,
      ...doc.data(),
    }));

    return res.json({ ok: true, orders: data });
  } catch (error) {
    console.error('Failed to load orders:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to load orders',
    });
  }
}
