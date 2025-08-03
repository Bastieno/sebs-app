import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const { name, phone } = req.body;

    if (!name && !phone) {
      res.status(400).json({
        success: false,
        message: 'No fields to update',
        error: 'Please provide a name or phone number to update'
      } as ApiResponse);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    } as ApiResponse);

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update profile'
    } as ApiResponse);
  }
};
