import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { IAuthRequest } from '../types';

export const auth = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key') as { _id: string };
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

export const adminAuth = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }
    return next();
    });
    return next()
  } catch (error) {
   return res.status(401).json({ error: 'Please authenticate.' });
  }
}; 