import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import WebSocket from 'ws';

describe('Chat Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let ws: WebSocket;

  const user1 = {
    email: 'user1@example.com',
    password: 'password123'
  };

  const user2 = {
    email: 'user2@example.com',
    password: 'password123'
  };

  const admin = {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    
    // Create test users
    const user1Response = await request(app)
      .post('/api/users/register')
      .send(user1);
    user1Token = user1Response.body.token;

    const user2Response = await request(app)
      .post('/api/users/register')
      .send(user2);
    user2Token = user2Response.body.token;

    const adminResponse = await request(app)
      .post('/api/users/register')
      .send(admin);
    adminToken = adminResponse.body.token;
  });

  afterEach(() => {
    if (ws) {
      ws.close();
    }
  });

  describe('POST /api/chat', () => {
    it('should create a new chat', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          participants: [user1.email, user2.email]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('participants');
      expect(response.body.participants).toHaveLength(2);
    });

    it('should not create chat without authentication', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          participants: [user1.email, user2.email]
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/chat', () => {
    beforeEach(async () => {
      // Create a test chat
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          participants: [user1.email, user2.email]
        });
    });

    it('should get user chats', async () => {
      const response = await request(app)
        .get('/api/chat')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('should get all chats for admin', async () => {
      const response = await request(app)
        .get('/api/chat')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });
  });

  describe('WebSocket Chat', () => {
    let chatId: string;

    beforeEach(async () => {
      // Create a test chat
      const chatResponse = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          participants: [user1.email, user2.email]
        });
      chatId = chatResponse.body._id;
    });

    it('should connect to chat websocket', (done) => {
      ws = new WebSocket(`ws://localhost:3000/ws/chat/${chatId}?token=${user1Token}`);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      });
    });

    it('should send and receive messages', (done) => {
      ws = new WebSocket(`ws://localhost:3000/ws/chat/${chatId}?token=${user1Token}`);
      
      ws.on('open', () => {
        const message = {
          type: 'message',
          content: 'Hello, World!',
          chatId: chatId
        };
        ws.send(JSON.stringify(message));
      });

      ws.on('message', (data) => {
        const receivedMessage = JSON.parse(data.toString());
        expect(receivedMessage.content).toBe('Hello, World!');
        done();
      });
    });
  });
}); 