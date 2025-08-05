'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera,
  ScanLine,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Users
} from 'lucide-react';

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    user?: string;
    message: string;
    timestamp: Date;
  } | null>(null);

  // Mock recent activity - will be replaced with real data
  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'ENTRY', time: '2 min ago', status: 'success' },
    { id: 2, user: 'Jane Smith', action: 'EXIT', time: '5 min ago', status: 'success' },
    { id: 3, user: 'Mike Johnson', action: 'ENTRY', time: '8 min ago', status: 'denied' },
  ];

  const handleStartScanning = () => {
    setIsScanning(true);
    // Mock scanning process - will be replaced with real QR scanner
    setTimeout(() => {
      setLastResult({
        success: true,
        user: 'John Doe',
        message: 'Access granted - Premium Plan',
        timestamp: new Date()
      });
      setIsScanning(false);
    }, 2000);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
          <p className="text-gray-600 mt-2">
            Scan QR codes for access control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner Interface */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scanner Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={scanMode === 'ENTRY' ? 'default' : 'outline'}
                  onClick={() => setScanMode('ENTRY')}
                  className="flex-1"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Entry
                </Button>
                <Button
                  variant={scanMode === 'EXIT' ? 'default' : 'outline'}
                  onClick={() => setScanMode('EXIT')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Camera Preview */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>Camera Preview</CardTitle>
              <CardDescription>
                Position QR code within the scanning area
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              {!isScanning ? (
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-16 w-16 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Camera Ready</p>
                    <p className="text-gray-600">Click start to begin scanning</p>
                  </div>
                  <Button onClick={handleStartScanning} size="lg">
                    <ScanLine className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-blue-100 rounded-lg flex items-center justify-center animate-pulse">
                    <ScanLine className="h-16 w-16 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-blue-600">Scanning...</p>
                    <p className="text-gray-600">Hold QR code steady</p>
                  </div>
                  <Button onClick={handleStopScanning} variant="outline">
                    Stop Scanning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Scan Result */}
          {lastResult && (
            <Card className={`border-2 ${lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {lastResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Last Scan Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">User:</span>
                    <span>{lastResult.user || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                      {lastResult.success ? 'Success' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Message:</span>
                    <span className="text-right">{lastResult.message}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Time:</span>
                    <span>{lastResult.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mode:</span>
                <Badge variant={scanMode === 'ENTRY' ? 'default' : 'secondary'}>
                  {scanMode}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Scanner:</span>
                <Badge variant={isScanning ? 'default' : 'secondary'}>
                  {isScanning ? 'Active' : 'Ready'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audio:</span>
                <Badge variant={audioEnabled ? 'default' : 'secondary'}>
                  {audioEnabled ? 'On' : 'Off'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Occupancy:</span>
                <span className="font-medium">18/50</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Today&apos;s Scans:</span>
                <span className="font-medium">42</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate:</span>
                <span className="font-medium text-green-600">94%</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-gray-600">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={activity.status === 'success' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {activity.action}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Scanner
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Manual Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
