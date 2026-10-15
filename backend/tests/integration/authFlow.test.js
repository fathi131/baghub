const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

const users = [];

app.post('/api/user/signup', async (req, res) => {
  const { email, password } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: 'User exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });
  res.status(201).json({ message: 'Signup successful' });
});

app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: 'Invalid' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid' });

  res.status(200).json({ token: 'mock-token' });
});

describe('Integration Test — Auth Flow', () => {
  test('signup then login works', async () => {
    const signupRes = await request(app)
      .post('/api/user/signup')
      .send({ email: 'newuser@test.com', password: 'Test@1234' });
    expect(signupRes.statusCode).toBe(201);

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'newuser@test.com', password: 'Test@1234' });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  test('duplicate signup → 400', async () => {
    await request(app)
      .post('/api/user/signup')
      .send({ email: 'dup@test.com', password: 'Test@1234' });

    const res = await request(app)
      .post('/api/user/signup')
      .send({ email: 'dup@test.com', password: 'Test@1234' });

    expect(res.statusCode).toBe(400);
  });

  test('wrong password → 400', async () => {
    await request(app)
      .post('/api/user/signup')
      .send({ email: 'user2@test.com', password: 'Test@1234' });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'user2@test.com', password: 'wrong' });

    expect(res.statusCode).toBe(400);
  });
});