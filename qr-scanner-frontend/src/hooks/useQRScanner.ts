'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, Result, NotFoundException } from '@zxing/library';

interface QRScanResult {
  text: string;
  timestamp: Date;
  format: string;
}

interface QRScannerState {
  isScanning: boolean;
  lastResult: QRScanResult | null;
  error: string | null;
  isInitializing: boolean;
}

interface UseQRScannerOptions {
  onResult?: (result: QRScanResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  scanDelay?: number;
}

interface UseQRScannerReturn extends QRScannerState {
  startScanning: (videoElement: HTMLVideoElement, deviceId?: string) => Promise<void>;
  stopScanning: () => void;
  scanSingleFrame: (videoElement: HTMLVideoElement) => Promise<QRScanResult | null>;
}

export function useQRScanner(options: UseQRScannerOptions = {}): UseQRScannerReturn {
  const {
    onResult,
    onError,
    continuous = true,
    scanDelay = 300
  } = options;

  const [state, setState] = useState<QRScannerState>({
    isScanning: false,
    lastResult: null,
    error: null,
    isInitializing: false,
  });

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Initialize the QR code reader
  const initializeReader = useCallback(async (): Promise<BrowserMultiFormatReader> => {
    if (readerRef.current) {
      return readerRef.current;
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      
      setState(prev => ({ ...prev, isInitializing: false }));
      return reader;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize QR scanner';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isInitializing: false 
      }));
      throw error;
    }
  }, []);

  // Process scan result
  const processResult = useCallback((result: Result): QRScanResult => {
    const scanResult: QRScanResult = {
      text: result.getText(),
      timestamp: new Date(),
      format: result.getBarcodeFormat().toString(),
    };

    setState(prev => ({ ...prev, lastResult: scanResult, error: null }));
    
    // Trigger callback
    if (onResult) {
      onResult(scanResult);
    }

    return scanResult;
  }, [onResult]);

  // Scan single frame from video element
  const scanSingleFrame = useCallback(async (videoElement: HTMLVideoElement): Promise<QRScanResult | null> => {
    try {
      const reader = await initializeReader();
      
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        return null;
      }

      // Create canvas and draw current video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert canvas to image element for @zxing/library
      const imageDataUrl = canvas.toDataURL('image/png');
      const img = new Image();
      img.src = imageDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Use decodeFromImageElement - this is the correct API method
      const result = await reader.decodeFromImageElement(img);
      return processResult(result);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        // No QR code found - this is normal, not an error
        return null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Scan failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      if (onError) {
        onError(errorMessage);
      }
      
      return null;
    }
  }, [initializeReader, processResult, onError]);

  // Continuous scanning loop
  const scanLoop = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!scanningRef.current) {
      return;
    }

    const now = Date.now();
    
    // Throttle scanning based on scanDelay
    if (now - lastScanTimeRef.current >= scanDelay) {
      try {
        const result = await scanSingleFrame(videoElement);
        
        if (result && !continuous) {
          // Stop scanning after first result if not continuous
          scanningRef.current = false;
          setState(prev => ({ ...prev, isScanning: false }));
          return;
        }
        
        lastScanTimeRef.current = now;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Error already handled in scanSingleFrame
      }
    }

    // Continue scanning
    if (scanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => scanLoop(videoElement));
    }
  }, [scanDelay, scanSingleFrame, continuous]);

  // Start continuous scanning
  const startScanning = useCallback(async (videoElement: HTMLVideoElement): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Initialize reader
      await initializeReader();

      // Wait for video to be ready
      if (videoElement.readyState < 2) {
        await new Promise<void>((resolve) => {
          const handleLoadedData = () => {
            videoElement.removeEventListener('loadeddata', handleLoadedData);
            resolve();
          };
          videoElement.addEventListener('loadeddata', handleLoadedData);
        });
      }

      // Start scanning
      scanningRef.current = true;
      setState(prev => ({ ...prev, isScanning: true }));
      
      // Begin scan loop
      scanLoop(videoElement);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scanning';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isScanning: false 
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [initializeReader, scanLoop, onError]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    scanningRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch (error) {
          console.warn('Error resetting QR reader:', error);
        }
      }
    };
  }, [stopScanning]);

  return {
    ...state,
    startScanning,
    stopScanning,
    scanSingleFrame,
  };
}
