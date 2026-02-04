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
    const { products = [], orders = [], reservations = [] } = normalizeBody(req);

    const applyBatch = async (items, collectionName) => {
      if (!Array.isArray(items) || items.length === 0) return 0;
      let count = 0;
      for (let i = 0; i < items.length; i += 500) {
        const batch = firestore.batch();
        items.slice(i, i + 500).forEach((item) => {
          const id = item?.id != null ? String(item.id) : String(Date.now());
          const ref = firestore.collection(collectionName).doc(id);
          batch.set(ref, { ...item, id: item?.id ?? id }, { merge: true });
        });
        await batch.commit();
        count += items.slice(i, i + 500).length;
      }
      return count;
    };

    const results = {
      products: await applyBatch(products, 'products'),
      orders: await applyBatch(orders, 'orders'),
      reservations: await applyBatch(reservations, 'table_reservations'),
    };

    return res.json({ ok: true, results });
  } catch (error) {
    console.error('Failed to sync local data:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to sync local data',
    });
  }
}
