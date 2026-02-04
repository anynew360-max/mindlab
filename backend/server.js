// Simple Express server to serve products.json on /api/products
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const admin = require('firebase-admin');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const getAdminApp = () => {
  if (admin.apps.length) return admin.app();

  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const fullPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(fullPath)) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH not found');
    }
    serviceAccount = require(fullPath);
  }

  if (!serviceAccount) {
    throw new Error('Missing Firebase service account configuration');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

app.get('/api/products', (req, res) => {
  const filePath = path.join(__dirname, '../app/public/data/products.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Cannot read products.json' });
    try {
      const json = JSON.parse(data);
      res.json(json.products || json);
    } catch (e) {
      res.status(500).json({ error: 'Invalid JSON format' });
    }
  });
});

app.post('/api/sync-auth-users', async (req, res) => {
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

    res.json({ ok: true, count: total });
  } catch (error) {
    console.error('Failed to sync auth users:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to sync users',
    });
  }
});

app.post('/api/sync-local-data', async (req, res) => {
  try {
    getAdminApp();
    const firestore = admin.firestore();
    const { products = [], orders = [], reservations = [] } = req.body || {};

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

    res.json({ ok: true, results });
  } catch (error) {
    console.error('Failed to sync local data:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to sync local data',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
