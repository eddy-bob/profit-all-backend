import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';

describe('Authentication Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should not register user with existing email', async () => {
      await User.create(testUser);
      const response = await request(app)
        .post('/api/users/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/users/profile', () => {
    let token: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(testUser);
      token = registerResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testUser.email);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Please authenticate.');
    });
  });
}); 