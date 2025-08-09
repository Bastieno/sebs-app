'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useQRScanner } from '@/hooks/useQRScanner';
import { validateQRCode, ValidationResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Camera, 
  CameraOff, 
  SwitchCamera, 
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Users,
  Shield
} from 'lucide-react';

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

interface ScannerProps {
  onResult?: (result: QRScanResult, validation?: ValidationResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
  mode?: 'ENTRY' | 'EXIT';
  adminMode?: boolean;
}

export function Scanner({
  onResult,
  onError,
  continuous = true,
  className = '',
  showControls = true,
  autoStart = false,
  mode = 'ENTRY',
  adminMode = false
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<QRScanResult | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const lastProcessedQR = useRef<string>('');
  const lastProcessedTime = useRef<number>(0);
  const scannerFunctionsRef = useRef<{
    startScanning?: (video: HTMLVideoElement, deviceId?: string) => void;
    stopScanning?: () => void;
  }>({});

  // Camera hook
  const {
    stream,
    isLoading: cameraLoading,
    error: cameraError,
    hasPermission,
    devices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
    requestPermission
  } = useCamera();

  // Handle QR validation
  const validateScannedCode = useCallback(async (qrData: string) => {
    // Prevent duplicate validation of the same QR code within 5 seconds
    const now = Date.now();
    if (
      isValidating || 
      (lastProcessedQR.current === qrData && now - lastProcessedTime.current < 5000)
    ) {
      console.log('Skipping duplicate QR validation');
      return null;
    }
    
    lastProcessedQR.current = qrData;
    lastProcessedTime.current = now;
    setIsValidating(true);
    
    try {
      // Always parse the QR code data to extract the token
      let qrToken;
      try {
        const parsedData = JSON.parse(qrData);
        qrToken = parsedData.token || qrData;
      } catch (e) {
        // If parsing fails, assume the QR data is the token itself
        qrToken = qrData;
      }
      
      if (!qrToken) {
        console.log('No QR token found, skipping validation');
        return null;
      }
      const response = await validateQRCode(qrToken, mode);
      const validationResult: ValidationResult = {
        qrData,
        response,
        timestamp: new Date()
      };
      
      setLastValidation(validationResult);
      
      // Show appropriate feedback
      switch (response.validationResult) {
        case 'SUCCESS':
          toast.success(`Access granted! Welcome ${response.user?.name || 'User'}`, {
            description: `${response.user?.plan || 'Plan'} • ${mode.toLowerCase()} recorded`
          });
          // Stop scanning after successful validation to prevent duplicates
          if (continuous && scannerFunctionsRef.current.stopScanning) {
            scannerFunctionsRef.current.stopScanning();
            // Auto restart after 3 seconds for next person
            setTimeout(() => {
              if (isActive) {
                const videoElement = videoRef.current;
                if (videoElement && stream && scannerFunctionsRef.current.startScanning) {
                  scannerFunctionsRef.current.startScanning(videoElement, selectedDeviceId || undefined);
                }
              }
            }, 3000);
          }
          break;
        case 'DENIED':
          toast.error('Access denied', {
            description: 'Invalid QR code or subscription'
          });
          break;
        case 'EXPIRED':
          toast.error('Subscription expired', {
            description: 'Please renew your subscription'
          });
          break;
        case 'INVALID_TIME':
          toast.error('Access not allowed at this time', {
            description: 'Outside of plan hours'
          });
          break;
        case 'CAPACITY_FULL':
          toast.error('Capacity full', {
            description: 'Maximum occupancy reached'
          });
          break;
        default:
          toast.error('Validation failed', {
            description: response.message || 'Unknown error'
          });
      }
      
      return validationResult;
    } catch (error) {
      console.error('QR validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      toast.error('Validation Error', {
        description: errorMessage
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [mode, isValidating, continuous, isActive, stream, selectedDeviceId]);

  // QR Scanner hook
  const {
    isScanning,
    lastResult,
    error: scannerError,
    isInitializing,
    startScanning,
    stopScanning,
    scanSingleFrame
  } = useQRScanner({
    onResult: async (result) => {
      if (!result) {
        console.log('Null result from scanner');
        return;
      }
      
      setLastScanResult(result);
      
      // Validate the QR code
      const validation = await validateScannedCode(result.text);
      
      if (validation && onResult) {
        onResult(result, validation);
      }
    },
    onError,
    continuous,
    scanDelay: 500 // Reduced since we stop after successful scan
  });

  // Store scanner functions in ref for use in validation callback
  useEffect(() => {
    scannerFunctionsRef.current = {
      startScanning,
      stopScanning
    };
  }, [startScanning, stopScanning]);

  const handleStart = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      await startCamera(selectedDeviceId || undefined);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start scanner:', error);
    }
  }, [hasPermission, requestPermission, startCamera, selectedDeviceId]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !isActive) {
      handleStart();
    }
  }, [autoStart, handleStart, isActive]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Start scanning when video is ready and camera is active
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement && stream && isActive && !isScanning) {
      const handleCanPlay = () => {
        startScanning(videoElement, selectedDeviceId || undefined);
      };

      if (videoElement.readyState >= 2) {
        // Video is already ready
        handleCanPlay();
      } else {
        // Wait for video to be ready
        videoElement.addEventListener('canplay', handleCanPlay, { once: true });
        return () => {
          videoElement.removeEventListener('canplay', handleCanPlay);
        };
      }
    }
  }, [stream, isActive, startScanning, selectedDeviceId, isScanning]);

  const handleStop = () => {
    stopScanning();
    stopCamera();
    setIsActive(false);
    // Reset last processed QR when stopping
    lastProcessedQR.current = '';
    lastProcessedTime.current = 0;
  };

  const handleSwitchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    if (nextDevice) {
      await switchCamera(nextDevice.deviceId);
    }
  };

  const handleSingleScan = async () => {
    if (videoRef.current && stream) {
      const result = await scanSingleFrame(videoRef.current);
      if (result) {
        setLastScanResult(result);
        
        // Validate the QR code
        const validation = await validateScannedCode(result.text);
        
        if (onResult) {
          onResult(result, validation || undefined);
        }
      }
    }
  };

  // Get status icon and color based on validation result
  const getValidationStatus = (validation?: ValidationResult) => {
    if (!validation) return { icon: AlertCircle, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    
    switch (validation.response.validationResult) {
      case 'SUCCESS':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'DENIED':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'EXPIRED':
        return { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'INVALID_TIME':
        return { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'CAPACITY_FULL':
        return { icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const error = cameraError || scannerError;
  const loading = cameraLoading || isInitializing;

  return (
    <div className={`scanner-container ${className}`}>
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-0">
          {/* Video Preview */}
          <div className="relative aspect-square bg-gray-900 rounded-t-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
            />
            
            {/* Scanning Overlay */}
            {isActive && (
              <div className="absolute inset-0 border-2 border-blue-500 bg-blue-500/10">
                <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                  {/* Corner indicators */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                </div>
                
                {/* Scanning animation */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-green-400 animate-pulse shadow-lg shadow-green-400/50" 
                         style={{ 
                           animation: 'scanLine 2s ease-in-out infinite alternate'
                         }} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {!stream && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80">
                <div className="text-center text-white">
                  <CameraOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera not active</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
                <div className="text-center text-white p-4">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {showControls && (
            <div className="p-4 space-y-4">
              {/* Main Controls */}
              <div className="flex justify-center space-x-2">
                {!isActive ? (
                  <Button onClick={handleStart} disabled={loading} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanner
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleStop} variant="outline" className="flex-1">
                      <CameraOff className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                    
                    {devices.length > 1 && (
                      <Button onClick={handleSwitchCamera} variant="outline" size="icon">
                        <SwitchCamera className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Single Scan Mode */}
              {isActive && !continuous && (
                <Button onClick={handleSingleScan} className="w-full" disabled={!stream}>
                  <Zap className="w-4 h-4 mr-2" />
                  Scan Now
                </Button>
              )}

              {/* Mode and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <Badge variant="outline" className="bg-blue-50">
                    {adminMode ? 'Admin' : mode} Mode
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Validating...
                      </Badge>
                    </>
                  ) : isScanning ? (
                    <>
                      <Zap className="w-4 h-4 text-green-500" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Scanning...
                      </Badge>
                    </>
                  ) : isActive ? (
                    <>
                      <Zap className="w-4 h-4 text-blue-500" />
                      <Badge variant="secondary">Ready</Badge>
                    </>
                  ) : (
                    <>
                      <CameraOff className="w-4 h-4 text-gray-500" />
                      <Badge variant="outline">Inactive</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Last Validation Result */}
              {lastValidation && (
                <div className={`mt-4 p-3 rounded-lg ${getValidationStatus(lastValidation).bgColor}`}>
                  <div className="flex items-start space-x-3">
                    {React.createElement(getValidationStatus(lastValidation).icon, {
                      className: `w-5 h-5 mt-0.5 flex-shrink-0 ${getValidationStatus(lastValidation).color}`
                    })}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {lastValidation.response.validationResult === 'SUCCESS' ? 'Access Granted' : 'Access Denied'}
                        </p>
                        <Badge 
                          variant={lastValidation.response.validationResult === 'SUCCESS' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {lastValidation.response.validationResult.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {lastValidation.response.user && (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700 font-medium">
                            {lastValidation.response.user.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {lastValidation.response.user.plan}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 break-all mt-2">
                        {lastValidation.qrData}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {lastValidation.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Raw QR Data (for debugging) */}
              {(lastResult || lastScanResult) && !lastValidation && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Raw QR Data</p>
                      <p className="text-sm text-gray-600 break-all">
                        {(lastResult || lastScanResult)?.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(lastResult || lastScanResult)?.format} • {' '}
                        {(lastResult || lastScanResult)?.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom styles for scanning animation */}
      <style jsx>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

export default Scanner;
