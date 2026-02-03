// Simple Express server to serve products.json on /api/products
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());

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

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
