'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scanner } from '@/components/scanner/Scanner';
import { useQRValidation } from '@/hooks/useApi';
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

  const { validateQR } = useQRValidation();

  const handleScanResult = async (result: QRScanResult) => {
    console.log('QR Code scanned:', result.text);
    
    try {
      // Call backend API for validation
      const validation = await validateQR(result.text, scanMode);
      
      const accessResult: AccessResult = {
        id: result.text,
        timestamp: result.timestamp,
        result: validation.validationResult === 'SUCCESS' ? 'success' : 'denied',
        message: validation.validationResult === 'SUCCESS' 
          ? `${scanMode.toLowerCase()} granted - Welcome!` 
          : `${scanMode.toLowerCase()} denied - ${validation.validationResult}`,
        user: validation.user?.name
      };
      
      setLastScan(accessResult);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        [validation.validationResult === 'SUCCESS' ? 'successful' : 'denied']: 
          prev[validation.validationResult === 'SUCCESS' ? 'successful' : 'denied'] + 1
      }));
      
    } catch (error) {
      console.error('QR validation failed:', error);
      
      const accessResult: AccessResult = {
        id: result.text,
        timestamp: result.timestamp,
        result: 'denied',
        message: error instanceof Error ? error.message : 'Validation failed - please try again',
        user: undefined
      };
      
      setLastScan(accessResult);
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        denied: prev.denied + 1
      }));
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scanner error:', error);
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
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
