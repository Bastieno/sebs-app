import { create } from 'zustand';
import { ValidationResponse } from '@/lib/api';

interface QRScanResult {
  text: string;
  timestamp: Date;
  format: string;
}

interface ValidationResult {
  qrData: string;
  response: ValidationResponse;
  timestamp: Date;
}

interface ScannerStats {
  successful: number;
  denied: number;
  total: number;
}

interface ScannerStore {
  // Scanner state
  lastScanResult: QRScanResult | null;
  lastValidation: ValidationResult | null;
  scanMode: 'ENTRY' | 'EXIT';
  isValidating: boolean;
  
  // Statistics
  stats: ScannerStats;
  
  // Actions
  setLastScanResult: (result: QRScanResult | null) => void;
  setLastValidation: (validation: ValidationResult | null) => void;
  setScanMode: (mode: 'ENTRY' | 'EXIT') => void;
  setIsValidating: (validating: boolean) => void;
  updateStats: (validation: ValidationResult) => void;
  clearLastResults: () => void;
  resetStats: () => void;
}

export const useScannerStore = create<ScannerStore>((set) => ({
  // Initial state
  lastScanResult: null,
  lastValidation: null,
  scanMode: 'ENTRY',
  isValidating: false,
  stats: {
    successful: 0,
    denied: 0,
    total: 0,
  },
  
  // Actions
  setLastScanResult: (result) => set({ lastScanResult: result }),
  
  setLastValidation: (validation) => set({ lastValidation: validation }),
  
  setScanMode: (mode) => set((state) => {
    // Clear last results when mode changes
    return {
      scanMode: mode,
      lastScanResult: null,
      lastValidation: null,
    };
  }),
  
  setIsValidating: (validating) => set({ isValidating: validating }),
  
  updateStats: (validation) => set((state) => {
    const isSuccess = validation.response.validationResult === 'SUCCESS';
    return {
      stats: {
        total: state.stats.total + 1,
        successful: state.stats.successful + (isSuccess ? 1 : 0),
        denied: state.stats.denied + (isSuccess ? 0 : 1),
      },
    };
  }),
  
  clearLastResults: () => set({
    lastScanResult: null,
    lastValidation: null,
  }),
  
  resetStats: () => set({
    stats: {
      successful: 0,
      denied: 0,
      total: 0,
    },
  }),
}));
