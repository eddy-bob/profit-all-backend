import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';

type Role = 'admin' | 'user';

export const roleGuard = (roles: Role[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    return next();
  };
}; 