// API configuration and service functions for QR Scanner frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types for API responses
export interface ValidationResponse {
  success: boolean;
  validationResult: 'SUCCESS' | 'DENIED' | 'EXPIRED' | 'INVALID_TIME' | 'CAPACITY_FULL';
  user?: {
    name: string;
    plan: string;
  };
  message?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  subscriptionId: string;
  action: 'ENTRY' | 'EXIT';
  validationResult: string;
  scannerLocation: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
  subscription: {
    plan: {
      name: string;
    };
  };
}

export interface CapacityData {
  success: boolean;
  data: {
    totalCapacity: number;
    totalCurrentOccupancy: number;
    planBasedCapacity: number;
    breakdown: Array<{
      id: string;
      name: string;
      maxCapacity: number | null;
      currentCapacity: number;
    }>;
  };
}

// Helper function to make authenticated API calls
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token from localStorage (you might want to use a more secure method)
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// QR Code validation API
export async function validateQRCode(
  qrToken: string, 
  action: 'ENTRY' | 'EXIT' = 'ENTRY'
): Promise<ValidationResponse> {
  return apiCall<ValidationResponse>('/api/access/validate-qr', {
    method: 'POST',
    body: JSON.stringify({ qrToken, action }),
  });
}

// Get access logs
export async function getAccessLogs(): Promise<{ success: boolean; data: AccessLog[] }> {
  return apiCall<{ success: boolean; data: AccessLog[] }>('/api/access/logs');
}

// Get current capacity
export async function getCurrentCapacity(): Promise<CapacityData> {
  return apiCall<CapacityData>('/api/access/current-capacity');
}

// Generate QR code for a subscription
export async function generateQRCode(subscriptionId: string): Promise<{ qrCode: string }> {
  return apiCall<{ qrCode: string }>('/api/qr-code/generate', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId }),
  });
}

// Admin override validation (if you have admin endpoints)
export async function adminValidateQRCode(
  qrToken: string,
  action: 'ENTRY' | 'EXIT' = 'ENTRY',
  adminOverride: boolean = false
): Promise<ValidationResponse> {
  return apiCall<ValidationResponse>('/api/admin/validate-qr', {
    method: 'POST',
    body: JSON.stringify({ qrToken, action, adminOverride }),
  });
}

// Health check to test API connectivity
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return apiCall<{ status: string; timestamp: string }>('/health');
}

// Error handler for API calls
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility to check if we're running in development mode
export const isDevelopment = process.env.NODE_ENV === 'development';

// Mock data fallback for development when backend is not available
export const mockValidationResponse = (): ValidationResponse => ({
  success: Math.random() > 0.3,
  validationResult: Math.random() > 0.3 ? 'SUCCESS' : 'DENIED',
  user: Math.random() > 0.3 ? {
    name: 'John Doe',
    plan: 'Premium Plan'
  } : undefined
});

// Configuration for API timeouts and retries
export const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};
