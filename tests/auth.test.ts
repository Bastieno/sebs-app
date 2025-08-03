import request from 'supertest';
import app from '../src/server';
import { prisma } from '../src/config/database';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@test.com`,
        name: 'Test User',
        phone: '1234567890',
        password: 'Password123!',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('token');
  });
});
