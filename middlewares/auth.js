import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import ErrorHandler from '../utils/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ErrorHandler(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ErrorHandler(401, 'Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ErrorHandler(401, 'Invalid or expired token'));
    }
    next(error);
  }
};

