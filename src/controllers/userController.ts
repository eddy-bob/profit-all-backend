import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import {  IAuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = new User({ email, password });
    
    await user.save();
   
    const token = jwt.sign(
      { _id: user._id },
      (process.env.JWT_SECRET || 'your_jwt_secret_key') as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
    );

   return res.status(201).json({ user: {email:user.email, _id:user._id, createdAt:user.createdAt, updatedAt:user.updatedAt, role:user.role}, token });
  } catch (error) {
    return res.status(400).json({ error: error||'Error creating user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
     console.log(user)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await (user as unknown as { comparePassword(password: string): Promise<boolean> }).comparePassword(password);    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { _id: user._id },
      (process.env.JWT_SECRET || 'your_jwt_secret_key') as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
    );

   return res.json({user: {email:user.email, _id:user._id, createdAt:user.createdAt, updatedAt:user.updatedAt, role:user.role}, token });
  } catch (error) {
    return res.status(400).json({ error: error||'Error logging in' });  }
};
export const getProfile = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
   return res.json(user);
  } catch (error) {
    return res.status(400).json({ error:error|| 'Error fetching profile' });
  }
};