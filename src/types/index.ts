import { Request } from 'express';

export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  _id: string;
  userId: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'BUY' | 'SELL';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat {
  _id: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  sender: string;
  chat: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthRequest extends Request {
  user?: IUser;
  params: {
    id?: string;
    chatId?: string;
  };
  body: {
    [key: string]: any;
  };
}

export interface IError extends Error {
  statusCode?: number;
} 