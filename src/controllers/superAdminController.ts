import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword, validatePassword } from '../utils/password';

// Placeholder for Super Admin Controller
// TODO: Implement Super Admin functionalities

export const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, name, phone, password, role } = req.body;

  // Basic validation
  if (!email || !name || !password || !role) {
    return res.status(400).json({ message: 'Email, name, password, and role are required' });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ 
      message: 'Password is not strong enough',
      errors: passwordValidation.errors 
    });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { name, phone, role, isActive } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        phone,
        role,
        isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPlan = async (req: Request, res: Response): Promise<Response> => {
  const { name, price, timeUnit, duration, maxCapacity } = req.body;

  if (!name || !price || !timeUnit || !duration) {
    return res.status(400).json({ message: 'Name, price, time unit, and duration are required' });
  }

  // Validate timeUnit
  const validTimeUnits = ['MINUTES', 'HOURS', 'DAYS', 'WEEK', 'MONTH', 'YEAR'];
  if (!validTimeUnits.includes(timeUnit)) {
    return res.status(400).json({ message: 'Invalid time unit. Must be one of: MINUTES, HOURS, DAYS, WEEK, MONTH, YEAR' });
  }

  try {
    const newPlan = await prisma.plan.create({
      data: {
        name,
        price,
        timeUnit,
        duration,
        maxCapacity,
      },
    });
    return res.status(201).json(newPlan);
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePlan = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { name, price, timeUnit, duration, maxCapacity, isActive } = req.body;

  // Validate timeUnit if provided
  if (timeUnit) {
    const validTimeUnits = ['MINUTES', 'HOURS', 'DAYS', 'WEEK', 'MONTH', 'YEAR'];
    if (!validTimeUnits.includes(timeUnit)) {
      return res.status(400).json({ message: 'Invalid time unit. Must be one of: MINUTES, HOURS, DAYS, WEEK, MONTH, YEAR' });
    }
  }

  try {
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        price,
        timeUnit,
        duration,
        maxCapacity,
        isActive,
      },
    });
    return res.status(200).json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSystemStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userCount = await prisma.user.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });
    const totalRevenue = await prisma.paymentReceipt.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'APPROVED',
      },
    });

    return res.status(200).json({
      totalUsers: userCount,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<Response> => {
  const { email, name, phone, password } = req.body;

  // Basic validation
  if (!email || !name || !password) {
    return res.status(400).json({ message: 'Email, name, and password are required' });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      message: 'Password is not strong enough',
      errors: passwordValidation.errors,
    });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with ADMIN role
    const staff = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating staff:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
