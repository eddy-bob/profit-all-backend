import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Order } from '../models/Order';

describe('Order Tests', () => {
  let userToken: string;
  let adminToken: string;
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };
  const adminUser = {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/users/register')
      .send(testUser);
    userToken = userResponse.body.token;

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/users/register')
      .send(adminUser);
    adminToken = adminResponse.body.token;
  });

  describe('POST /api/orders', () => {
    const testOrder = {
      symbol: 'AAPL',
      quantity: 10,
      price: 150.00,
      type: 'BUY'
    };

    it('should create a new order', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testOrder);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('symbol', testOrder.symbol);
      expect(response.body).toHaveProperty('quantity', testOrder.quantity);
      expect(response.body).toHaveProperty('price', testOrder.price);
      expect(response.body).toHaveProperty('type', testOrder.type);
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should not create order without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(testOrder);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create some test orders
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          symbol: 'AAPL',
          quantity: 10,
          price: 150.00,
          type: 'BUY'
        });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          symbol: 'GOOGL',
          quantity: 5,
          price: 2500.00,
          type: 'SELL'
        });
    });

    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should get all orders for admin', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let orderId: string;

    beforeEach(async () => {
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          symbol: 'AAPL',
          quantity: 10,
          price: 150.00,
          type: 'BUY'
        });
      orderId = orderResponse.body._id;
    });

    it('should update order status as admin', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
    });

    it('should not update order status as regular user', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(403);
    });
  });
}); 