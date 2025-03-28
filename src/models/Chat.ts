import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

export interface IChat {
  participants: IUser["_id"][];
  orderId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
