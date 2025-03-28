# Profit All Backend

This is the backend service for the Profit All assessment project. It provides APIs for user management, order management, and real-time chat functionality.

## Features

- User Authentication (Admin and Regular Users)
- Order Management System
- Real-time Chat System using WebSocket
- Role-based Access Control
- MongoDB Database Integration
- TypeScript Support
- RESTful API Design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

# Admin Configuration
ADMIN_EMAIL=admin@profitall.com
ADMIN_PASSWORD=admin123

## API Documentation

### Authentication Endpoints

- `POST /api/users/register` - Register a new user
  - Body: `{ email: string, password: string }`
  - Response: `{ token: string, user: { id: string, email: string, role: string } }`

- `POST /api/users/login` - Login user
  - Body: `{ email: string, password: string }`
  - Response: `{ token: string, user: { id: string, email: string, role: string } }`

- `GET /api/users/profile` - Get user profile
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ id: string, email: string, role: string }`

### Order Endpoints

- `POST /api/orders` - Create a new order
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ symbol: string, price: number, type: 'BUY' | 'SELL', quantity: number }`
  - Response: `{ order: Order, chat: Chat }`

- `GET /api/orders` - Get all orders (filtered by user role)
  - Headers: `Authorization: Bearer <token>`
  - Query: `?status=PENDING|COMPLETED|CANCELLED` (optional)
  - Response: `Order[]`

- `GET /api/orders/:id` - Get order by ID
  - Headers: `Authorization: Bearer <token>`
  - Response: `Order`

- `PATCH /api/orders/:id/status` - Update order status (Admin only)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ status: 'PENDING' | 'COMPLETED' | 'CANCELLED' }`
  - Response: `Order`

### Chat Endpoints

- `GET /api/chat` - Get all chat rooms (filtered by user role)
  - Headers: `Authorization: Bearer <token>`
  - Response: `Chat[]`

- `GET /api/chat/:id` - Get chat room by ID with messages
  - Headers: `Authorization: Bearer <token>`
  - Response: `Chat`

- `POST /api/chat` - Create a new chat
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ participants: string[] }`
  - Response: `Chat`

- `GET /api/chat/:id/messages` - Get messages for a chat room
  - Headers: `Authorization: Bearer <token>`
  - Response: `Message[]`

- `POST /api/chat/:id/messages` - Send a message in a chat room
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ content: string }`
  - Response: `Message`

### WebSocket Events

- `join_chat` - Join a chat room
  - Payload: `{ type: 'join_chat', chatId: string }`

- `leave_chat` - Leave a chat room
  - Payload: `{ type: 'leave_chat', chatId: string }`

- `message` - Send a message in a chat room
  - Payload: `{ type: 'message', chatId: string, content: string }`

- `new_message` - Receive new message event
  - Payload: `{ type: 'new_message', data: Message }`

- `chat_closed` - Receive chat room closed event
  - Payload: `{ type: 'chat_closed', chatId: string }`

- `error` - Receive error event
  - Payload: `{ type: 'error', message: string }`

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd profit-all-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following variables:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/profit-all
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
SOCKET_PORT=3001
FRONTEND_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

All error responses follow the format:
```json
{
  "error": "Error message description"
}
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
└── index.ts        # Application entry point
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- CORS enabled
- Secure WebSocket connections

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 