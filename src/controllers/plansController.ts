import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

export const getAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [
        { durationType: 'asc' },
        { price: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        price: true,
        durationType: true,
        timeStart: true,
        timeEnd: true,
        startDateTime: true,
        endDateTime: true,
        maxCapacity: true,
        isCustom: true,
        notes: true,
        createdAt: true,
      }
    });

    // Group plans by duration type for better organization
    const groupedPlans = {
      daily: plans.filter(plan => plan.durationType === 'DAILY'),
      weekly: plans.filter(plan => plan.durationType === 'WEEKLY'),
      monthly: plans.filter(plan => plan.durationType === 'MONTHLY'),
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
        durationType: true,
        timeStart: true,
        timeEnd: true,
        maxCapacity: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
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
      data: {
        ...plan,
        activeSubscriptions: plan._count.subscriptions
      }
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
        durationType: true,
        timeStart: true,
        timeEnd: true,
      },
      orderBy: [
        { durationType: 'asc' },
        { price: 'asc' }
      ]
    });

    // Create pricing structure for frontend display
    const pricingStructure = {
      daily: {
        morning: plans.find(p => p.durationType === 'DAILY' && p.timeStart === '08:00'),
        afternoon: plans.find(p => p.durationType === 'DAILY' && p.timeStart === '12:00'),
        night: plans.find(p => p.durationType === 'DAILY' && p.timeStart === '18:00'),
      },
      weekly: {
        morning: plans.find(p => p.durationType === 'WEEKLY' && p.timeStart === '08:00'),
        afternoon: plans.find(p => p.durationType === 'WEEKLY' && p.timeStart === '12:00'),
        night: plans.find(p => p.durationType === 'WEEKLY' && p.timeStart === '18:00'),
        teamNight: plans.find(p => p.name.includes('Team Night')),
      },
      monthly: {
        standard: plans.find(p => p.durationType === 'MONTHLY' && p.price.toString() === '30000'),
        premium: plans.find(p => p.durationType === 'MONTHLY' && p.price.toString() === '40000'),
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
    const { name, price, startDateTime, endDateTime, notes } = req.body;

    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      } as ApiResponse);
      return;
    }

    // Validate required fields
    if (!name || !price || !startDateTime || !endDateTime) {
      res.status(400).json({
        success: false,
        message: 'Name, price, start date time, and end date time are required'
      } as ApiResponse);
      return;
    }

    // Validate and parse date times
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date time format'
      } as ApiResponse);
      return;
    }

    if (endDate <= startDate) {
      res.status(400).json({
        success: false,
        message: 'End date time must be after start date time'
      } as ApiResponse);
      return;
    }

    // Create custom plan (always DAILY duration type for custom plans)
    const plan = await prisma.plan.create({
      data: {
        name,
        price: parseFloat(price),
        durationType: 'DAILY',
        startDateTime: startDate,
        endDateTime: endDate,
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
    const { name, price, startDateTime, endDateTime, notes, isActive } = req.body;

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

    // Validate and parse date times if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateTime) {
      startDate = new Date(startDateTime);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid start date time format'
        } as ApiResponse);
        return;
      }
    }

    if (endDateTime) {
      endDate = new Date(endDateTime);
      if (isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid end date time format'
        } as ApiResponse);
        return;
      }
    }

    // If both dates provided, validate that end is after start
    if (startDate && endDate && endDate <= startDate) {
      res.status(400).json({
        success: false,
        message: 'End date time must be after start date time'
      } as ApiResponse);
      return;
    }

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price && { price: parseFloat(price) }),
        ...(startDate && { startDateTime: startDate }),
        ...(endDate && { endDateTime: endDate }),
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
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
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

    // Check if plan has active subscriptions
    if (existingPlan._count.subscriptions > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete plan with ${existingPlan._count.subscriptions} active subscription(s). Deactivate it instead.`
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
