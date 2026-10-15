const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());


app.get('/api/user/products', (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      { _id: '1', name: 'Backpack', price: 1000 },
      { _id: '2', name: 'Handbag', price: 2000 }
    ]
  });
});

app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  if (email === 'test@example.com' && password === 'Test@1234') {
    return res.status(200).json({ success: true, token: 'mock-jwt' });
  }
  return res.status(400).json({ message: 'Invalid credentials' });
});

describe('API Tests — Products', () => {
  test('GET /api/user/products → 200', async () => {
    const res = await request(app).get('/api/user/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('products have _id, name, price', async () => {
    const res = await request(app).get('/api/user/products');
    expect(res.body.data[0]).toHaveProperty('_id');
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('price');
  });
});

describe('API Tests — Login', () => {
  test('valid credentials → 200 + token', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@example.com', password: 'Test@1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('wrong password → 400', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    expect(res.statusCode).toBe(400);
  });

  test('missing fields → 400', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(400);
  });
});