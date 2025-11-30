import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

export const getAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [
        { timeUnit: 'asc' },
        { price: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        price: true,
        timeUnit: true,
        duration: true,
        maxCapacity: true,
        isCustom: true,
        notes: true,
        createdAt: true,
      }
    });

    // Group plans by time unit for better organization
    const groupedPlans = {
      hours: plans.filter(plan => plan.timeUnit === 'HOURS'),
      days: plans.filter(plan => plan.timeUnit === 'DAYS'),
      week: plans.filter(plan => plan.timeUnit === 'WEEK'),
      month: plans.filter(plan => plan.timeUnit === 'MONTH'),
      year: plans.filter(plan => plan.timeUnit === 'YEAR'),
    };

    res.status(200).json({
      success: true,
      message: 'Plans retrieved successfully',
      data: {
        plans,
        grouped: groupedPlans,
        total: plans.length
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve plans'
    } as ApiResponse);
  }
};

export const getPlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Plan ID is required',
        error: 'Missing plan ID parameter'
      } as ApiResponse);
      return;
    }

    const plan = await prisma.plan.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        timeUnit: true,
        duration: true,
        maxCapacity: true,
        isActive: true,
        createdAt: true,
      }
    });

    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found',
        error: 'Plan with the specified ID does not exist'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan
    } as ApiResponse);

  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve plan'
    } as ApiResponse);
  }
};

export const getPlanPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        timeUnit: true,
        duration: true,
      },
      orderBy: [
        { timeUnit: 'asc' },
        { price: 'asc' }
      ]
    });

    // Create pricing structure for frontend display based on plan names
    const pricingStructure = {
      hourly: {
        morning: plans.find(p => p.name.includes('Morning') && p.timeUnit === 'HOURS'),
        afternoon: plans.find(p => p.name.includes('Afternoon') && p.timeUnit === 'HOURS'),
        night: plans.find(p => p.name.includes('Night') && p.timeUnit === 'HOURS'),
      },
      weekly: {
        morning: plans.find(p => p.name.includes('Morning') && p.timeUnit === 'WEEK'),
        afternoon: plans.find(p => p.name.includes('Afternoon') && p.timeUnit === 'WEEK'),
        night: plans.find(p => p.name.includes('Night') && p.timeUnit === 'WEEK'),
        teamNight: plans.find(p => p.name.includes('Team Night')),
      },
      monthly: {
        standard: plans.find(p => p.name.includes('Standard') && p.timeUnit === 'MONTH'),
        premium: plans.find(p => p.name.includes('Premium') && p.timeUnit === 'MONTH'),
      }
    };

    res.status(200).json({
      success: true,
      message: 'Pricing structure retrieved successfully',
      data: pricingStructure
    } as ApiResponse);

  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve pricing'
    } as ApiResponse);
  }
};

// Create a custom plan (Admin only)
export const createCustomPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, timeUnit, duration, notes } = req.body;

    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      } as ApiResponse);
      return;
    }

    // Validate required fields
    if (!name || !price || !timeUnit || !duration) {
      res.status(400).json({
        success: false,
        message: 'Name, price, time unit, and duration are required'
      } as ApiResponse);
      return;
    }

    // Validate timeUnit
    const validTimeUnits = ['MINUTES', 'HOURS', 'DAYS', 'WEEK', 'MONTH', 'YEAR'];
    if (!validTimeUnits.includes(timeUnit)) {
      res.status(400).json({
        success: false,
        message: 'Invalid time unit. Must be one of: MINUTES, HOURS, DAYS, WEEK, MONTH, YEAR'
      } as ApiResponse);
      return;
    }

    // Validate duration is a positive number
    const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      res.status(400).json({
        success: false,
        message: 'Duration must be a positive number'
      } as ApiResponse);
      return;
    }

    // Create custom plan
    const plan = await prisma.plan.create({
      data: {
        name,
        price: parseFloat(price),
        timeUnit,
        duration: parsedDuration,
        isCustom: true,
        notes: notes || null,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Custom plan created successfully',
      data: plan
    } as ApiResponse);

  } catch (error) {
    console.error('Create custom plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create custom plan'
    } as ApiResponse);
  }
};

// Update a custom plan (Admin only)
export const updateCustomPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, price, timeUnit, duration, notes, isActive } = req.body;

    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      } as ApiResponse);
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      } as ApiResponse);
      return;
    }

    // Check if plan exists and is a custom plan
    const existingPlan = await prisma.plan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      } as ApiResponse);
      return;
    }

    if (!existingPlan.isCustom) {
      res.status(403).json({
        success: false,
        message: 'Cannot edit system plans. Only custom plans can be modified.'
      } as ApiResponse);
      return;
    }

    // Validate timeUnit if provided
    if (timeUnit) {
      const validTimeUnits = ['MINUTES', 'HOURS', 'DAYS', 'WEEK', 'MONTH', 'YEAR'];
      if (!validTimeUnits.includes(timeUnit)) {
        res.status(400).json({
          success: false,
          message: 'Invalid time unit. Must be one of: MINUTES, HOURS, DAYS, WEEK, MONTH, YEAR'
        } as ApiResponse);
        return;
      }
    }

    // Validate duration if provided
    let parsedDuration: number | undefined;
    if (duration) {
      parsedDuration = parseInt(duration);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        res.status(400).json({
          success: false,
          message: 'Duration must be a positive number'
        } as ApiResponse);
        return;
      }
    }

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price && { price: parseFloat(price) }),
        ...(timeUnit && { timeUnit }),
        ...(parsedDuration && { duration: parsedDuration }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.status(200).json({
      success: true,
      message: 'Custom plan updated successfully',
      data: updatedPlan
    } as ApiResponse);

  } catch (error) {
    console.error('Update custom plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update custom plan'
    } as ApiResponse);
  }
};

// Delete a custom plan (Admin only)
export const deleteCustomPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      } as ApiResponse);
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      } as ApiResponse);
      return;
    }

    // Check if plan exists and is a custom plan
    const existingPlan = await prisma.plan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      } as ApiResponse);
      return;
    }

    if (!existingPlan.isCustom) {
      res.status(403).json({
        success: false,
        message: 'Cannot delete system plans. Only custom plans can be deleted.'
      } as ApiResponse);
      return;
    }

    // Soft delete by deactivating
    const deletedPlan = await prisma.plan.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(200).json({
      success: true,
      message: 'Custom plan deleted successfully',
      data: deletedPlan
    } as ApiResponse);

  } catch (error) {
    console.error('Delete custom plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to delete custom plan'
    } as ApiResponse);
  }
};
