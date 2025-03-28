import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

export interface IMessage {
  sender: IUser['_id'];
  chat: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId as any,
    ref: 'User',
    required: true
  },
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Message = mongoose.model<IMessage>('Message', messageSchema); 