import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import ErrorHandler from '../utils/errorHandler.js';
import { TryCatch } from '../middlewares/error.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = TryCatch(async (req, res) => {
  const { username, email, password, full_name } = req.body;

  if (!username || !email || !password) {
    throw new ErrorHandler(400, 'Login ID, email, and password are required');
  }

  // Validate login ID length (6-12 characters)
  if (username.length < 6 || username.length > 12) {
    throw new ErrorHandler(400, 'Login ID must be between 6 and 12 characters');
  }

  // Validate password requirements
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ErrorHandler(400, 'Password must contain at least one lowercase letter, one uppercase letter, one special character, and be at least 8 characters long');
  }

  // Check if login ID exists
  const existingUserByUsername = await User.findByUsername(username);
  if (existingUserByUsername) {
    throw new ErrorHandler(400, 'Login ID already exists');
  }

  // Check if email exists
  const existingUserByEmail = await User.findByEmail(email);
  if (existingUserByEmail) {
    throw new ErrorHandler(400, 'Email already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    username,
    email,
    password_hash,
    full_name
  });

  // Generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'PRODUCTION',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    token
  });
});

export const login = TryCatch(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ErrorHandler(400, 'Username and password are required');
  }

  // Find user
  const user = await User.findByUsername(username);
  if (!user) {
    throw new ErrorHandler(401, 'Invalid Login Id or Password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log("🚀 ~ isValidPassword:", isValidPassword)
  if (!isValidPassword) {
    throw new ErrorHandler(401, 'Invalid Login Id or Password');
  }

  // Generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'PRODUCTION',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    token
  });
});

export const logout = TryCatch(async (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const getProfile = TryCatch(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export const updateProfile = TryCatch(async (req, res) => {
  const { full_name, email, password } = req.body;
  const updates = {};

  if (full_name !== undefined) updates.full_name = full_name;
  if (email !== undefined) updates.email = email;
  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  const user = await User.update(req.user.id, updates);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user
  });
});

