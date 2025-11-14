'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scanner } from '@/components/scanner/Scanner';
import { formatFriendlyTimestamp } from '@/lib/utils';
import { useScannerStore } from '@/lib/stores/scanner-store';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Users,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function ScannerPage() {
  const {
    lastValidation,
    scanMode,
    stats,
    setScanMode,
    updateStats,
  } = useScannerStore();

  const handleScanResult = (
    scanData: { text: string; timestamp: Date; format: string },
    validation?: {
      qrData: string;
      response: {
        success: boolean;
        validationResult: 'SUCCESS' | 'DENIED' | 'EXPIRED' | 'INVALID_TIME' | 'CAPACITY_FULL';
        user?: { name: string; plan: string };
        message?: string;
      };
      timestamp: Date;
    }
  ) => {
    if (validation) {
      updateStats(validation);
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

          {/* Last Scan Result */}
          {lastValidation && (
            <Card className={`border-2 ${
              lastValidation.response.validationResult === 'SUCCESS' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {lastValidation.response.validationResult === 'SUCCESS' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Last Scan Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {lastValidation.response.user && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-medium">{lastValidation.response.user.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={lastValidation.response.validationResult === 'SUCCESS' ? 'default' : 'destructive'}>
                      {lastValidation.response.validationResult === 'SUCCESS' ? 'Success' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="font-medium text-right">
                      {lastValidation.response.message || 
                       (lastValidation.response.validationResult === 'SUCCESS' 
                         ? (scanMode === 'EXIT' ? 'Exit recorded - Goodbye!' : 'Access granted - Welcome!')
                         : `${scanMode === 'EXIT' ? 'Exit' : 'Access'} denied - ${lastValidation.response.validationResult}`)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatFriendlyTimestamp(lastValidation.timestamp)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
