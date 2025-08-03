import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ApiResponse } from '../types';

interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  token: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password }: RegisterRequest = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
        error: 'Missing required fields: name, email, phone, password'
      } as ApiResponse);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Please provide a valid email address'
      } as ApiResponse);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        error: passwordValidation.errors.join(', ')
      } as ApiResponse);
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists',
        error: 'An account with this email already exists'
      } as ApiResponse);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        passwordHash: hashedPassword,
        role: 'USER', // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = generateToken(user as any);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token
      }
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to register user'
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Missing required fields'
      } as ApiResponse);
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'Email or password is incorrect'
      } as ApiResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account deactivated',
        error: 'Your account has been deactivated. Please contact support.'
      } as ApiResponse);
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'Email or password is incorrect'
      } as ApiResponse);
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token
      }
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to login'
    } as ApiResponse);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Fetch complete user profile
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User profile not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    } as ApiResponse);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve profile'
    } as ApiResponse);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Validate required fields
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        error: 'Missing required fields'
      } as ApiResponse);
      return;
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        error: passwordValidation.errors.join(', ')
      } as ApiResponse);
      return;
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        error: 'Please provide the correct current password'
      } as ApiResponse);
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: null
    } as ApiResponse);

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to change password'
    } as ApiResponse);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // For stateless JWT, logout is handled client-side by deleting the token.
    // This endpoint is provided for completeness and to allow for future
    // stateful logic (e.g., token blocklisting).
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {
        message: 'Token has been invalidated on the client-side.'
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'An unexpected error occurred during logout'
    } as ApiResponse);
  }
};
