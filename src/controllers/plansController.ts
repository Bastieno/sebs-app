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
        maxCapacity: true,
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
