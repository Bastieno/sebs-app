'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CameraState {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
}

interface UseCameraReturn extends CameraState {
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const [state, setState] = useState<CameraState>({
    stream: null,
    isLoading: false,
    error: null,
    hasPermission: false,
    devices: [],
    selectedDeviceId: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  // Get available camera devices
  const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }, []);

  // Request camera permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Request permission by trying to access camera
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the temporary stream
      tempStream.getTracks().forEach(track => track.stop());
      
      // Get available devices
      const devices = await getDevices();
      
      setState(prev => ({
        ...prev,
        hasPermission: true,
        devices,
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access denied';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        hasPermission: false,
        isLoading: false,
      }));
      return false;
    }
  }, [getDevices]);

  // Start camera with specific device
  const startCamera = useCallback(async (deviceId?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Configure video constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: deviceId ? undefined : 'environment',
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Update devices list if permission wasn't previously granted
      const devices = await getDevices();

      setState(prev => ({
        ...prev,
        stream,
        isLoading: false,
        hasPermission: true,
        devices,
        selectedDeviceId: deviceId || null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start camera';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        stream: null,
      }));
    }
  }, [getDevices]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      stream: null,
      selectedDeviceId: null,
    }));
  }, []);

  // Switch to different camera
  const switchCamera = useCallback(async (deviceId: string): Promise<void> => {
    await startCamera(deviceId);
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Check initial permission status
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (permission.state === 'granted') {
          const devices = await getDevices();
          setState(prev => ({
            ...prev,
            hasPermission: true,
            devices,
          }));
        }
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          setState(prev => ({
            ...prev,
            hasPermission: permission.state === 'granted',
          }));
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Permissions API not supported, will check when user tries to access camera
        console.log('Permissions API not supported');
      }
    };

    checkPermission();
  }, [getDevices]);

  return {
    ...state,
    startCamera,
    stopCamera,
    switchCamera,
    requestPermission,
  };
}
