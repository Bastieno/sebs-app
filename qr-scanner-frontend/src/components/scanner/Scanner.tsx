'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CameraOff, 
  SwitchCamera, 
  Zap, 
  ZapOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface QRScanResult {
  text: string;
  timestamp: Date;
  format: string;
}

interface ScannerProps {
  onResult?: (result: QRScanResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
}

export function Scanner({
  onResult,
  onError,
  continuous = true,
  className = '',
  showControls = true,
  autoStart = false
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<QRScanResult | null>(null);

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
    onResult: (result) => {
      setLastScanResult(result);
      if (onResult) {
        onResult(result);
      }
    },
    onError,
    continuous,
    scanDelay: 300
  });

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
        if (onResult) {
          onResult(result);
        }
      }
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

              {/* Scanning Status */}
              <div className="flex items-center justify-center space-x-2">
                {isScanning ? (
                  <>
                    <ZapOff className="w-4 h-4 text-green-500" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Scanning...
                    </Badge>
                  </>
                ) : isActive ? (
                  <>
                    <Zap className="w-4 h-4 text-blue-500" />
                    <Badge variant="secondary">Ready to scan</Badge>
                  </>
                ) : (
                  <>
                    <CameraOff className="w-4 h-4 text-gray-500" />
                    <Badge variant="outline">Inactive</Badge>
                  </>
                )}
              </div>

              {/* Last Result */}
              {(lastResult || lastScanResult) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Last Scan</p>
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
