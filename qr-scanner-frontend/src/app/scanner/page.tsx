'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scanner } from '@/components/scanner/Scanner';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Users,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface QRScanResult {
  text: string;
  timestamp: Date;
  format: string;
}

interface AccessResult {
  id: string;
  timestamp: Date;
  result: 'success' | 'denied';
  message: string;
  user?: string;
}

export default function ScannerPage() {
  const [lastScan, setLastScan] = useState<AccessResult | null>(null);
  const [stats, setStats] = useState({ successful: 0, denied: 0, total: 0 });
  const [scanMode, setScanMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  const handleScanResult = async (result: QRScanResult) => {
    console.log('QR Code scanned:', result.text);
    
    // Mock access validation (in real app, this would call your backend API)
    const mockValidation = Math.random() > 0.3;
    
    const accessResult: AccessResult = {
      id: result.text,
      timestamp: result.timestamp,
      result: mockValidation ? 'success' : 'denied',
      message: mockValidation 
        ? `${scanMode.toLowerCase()} granted - Welcome!` 
        : `${scanMode.toLowerCase()} denied - Please check your subscription`,
      user: mockValidation ? 'John Doe' : undefined
    };
    
    setLastScan(accessResult);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      [mockValidation ? 'successful' : 'denied']: prev[mockValidation ? 'successful' : 'denied'] + 1
    }));
    
    // TODO: Here you would call your backend API to validate the QR code
    // const validation = await fetch('/api/validate-qr', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ qrCode: result.text, mode: scanMode })
    // });
  };

  const handleScanError = (error: string) => {
    console.error('Scanner error:', error);
  };

  // Mock recent activity
  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'ENTRY', time: '2 min ago', status: 'success' },
    { id: 2, user: 'Jane Smith', action: 'EXIT', time: '5 min ago', status: 'success' },
    { id: 3, user: 'Mike Johnson', action: 'ENTRY', time: '8 min ago', status: 'denied' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
          <p className="text-gray-600 mt-2">
            Scan QR codes for access control
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Clock className="w-4 h-4 mr-1" />
          Ready to scan
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanner Interface */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Scanner Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setScanMode('ENTRY')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    scanMode === 'ENTRY' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ArrowRight className="h-4 w-4 mr-2 inline" />
                  Entry
                </button>
                <button
                  onClick={() => setScanMode('EXIT')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    scanMode === 'EXIT' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 inline" />
                  Exit
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Scanner Component */}
          <Scanner
            onResult={handleScanResult}
            onError={handleScanError}
            continuous={true}
            showControls={true}
            autoStart={false}
          />

          {/* Last Scan Result */}
          {lastScan && (
            <Card className={`border-2 ${
              lastScan.result === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {lastScan.result === 'success' ? (
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
                    <span className="font-medium">QR Code:</span>
                    <span className="text-right break-all max-w-[200px]">{lastScan.id}</span>
                  </div>
                  {lastScan.user && (
                    <div className="flex justify-between">
                      <span className="font-medium">User:</span>
                      <span>{lastScan.user}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={lastScan.result === 'success' ? 'default' : 'destructive'}>
                      {lastScan.result === 'success' ? 'Success' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Message:</span>
                    <span className="text-right">{lastScan.message}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Time:</span>
                    <span>{lastScan.timestamp.toLocaleString()}</span>
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
                <Badge variant="secondary">Ready</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Scans:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Successful:</span>
                <span className="font-medium text-green-600">{stats.successful}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Denied:</span>
                <span className="font-medium text-red-600">{stats.denied}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate:</span>
                <span className="font-medium text-blue-600">
                  {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                </span>
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
        </div>
      </div>
    </div>
  );
}
