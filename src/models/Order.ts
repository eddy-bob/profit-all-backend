import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const orderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  },
}, {
  timestamps: true,
});

export const Order = mongoose.model<IOrder>('Order', orderSchema); 