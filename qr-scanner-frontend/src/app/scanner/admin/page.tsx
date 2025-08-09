'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scanner } from '@/components/scanner/Scanner';
import { formatFriendlyTimestamp } from '@/lib/utils';
import { 
  Shield,
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Key,
  Settings
} from 'lucide-react';

interface QRScanResult {
  text: string;
  timestamp: Date;
  format: string;
}

interface AdminAccessResult {
  id: string;
  timestamp: Date;
  result: 'success' | 'denied';
  message: string;
  user?: string;
  override?: boolean;
}

export default function AdminScannerPage() {
  const [lastScan, setLastScan] = useState<AdminAccessResult | null>(null);
  const [stats, setStats] = useState({ successful: 0, denied: 0, overrides: 0, total: 0 });
  const [manualCode, setManualCode] = useState('');
  const [overrideMode, setOverrideMode] = useState(false);

  const handleScanResult = async (result: QRScanResult) => {
    console.log('Admin QR Code scanned:', result.text);
    
    // Admin scanner functionality not implemented yet
    // This would need admin-specific validation endpoints
    console.log('Admin QR Code validation needed for:', result.text);
    console.log('Override mode:', overrideMode);
    
    setLastScan(null);
  };

  const handleScanError = (error: string) => {
    console.error('Admin scanner error:', error);
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) return;
    
    // Simulate manual QR code processing
    const result: QRScanResult = {
      text: manualCode.trim(),
      timestamp: new Date(),
      format: 'MANUAL_ENTRY'
    };
    
    await handleScanResult(result);
    setManualCode('');
  };

  const handleForceAccess = () => {
    const accessResult: AdminAccessResult = {
      id: 'ADMIN_OVERRIDE',
      timestamp: new Date(),
      result: 'success',
      message: 'Access granted - Admin override activated',
      user: 'Admin Override',
      override: true
    };
    
    setLastScan(accessResult);
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      successful: prev.successful + 1,
      overrides: prev.overrides + 1
    }));
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Scanner
          </h1>
          <p className="text-gray-600 mt-2">
            Advanced QR scanning with admin privileges and override capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-sm">
            <Key className="w-4 h-4 mr-1" />
            Admin Mode
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Admin Scanner Interface */}
        <div className="lg:col-span-2 space-y-4">
          {/* Admin Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Override Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Override Mode</Label>
                  <p className="text-xs text-gray-600">Allow access regardless of validation result</p>
                </div>
                <button
                  onClick={() => setOverrideMode(!overrideMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    overrideMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      overrideMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label htmlFor="manual-code">Manual QR Code Entry</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-code"
                    placeholder="Enter QR code manually..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                  />
                  <Button onClick={handleManualEntry} disabled={!manualCode.trim()}>
                    Process
                  </Button>
                </div>
              </div>

              {/* Force Access Button */}
              <Button 
                onClick={handleForceAccess}
                variant="outline"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Force Access Override
              </Button>
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
                <CardTitle className="text-sm flex items-center gap-2">
                  {lastScan.result === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Admin Scan Result
                  {lastScan.override && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      OVERRIDE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">QR Code:</span>
                    <span className="font-medium text-right break-all max-w-[200px]">{lastScan.id}</span>
                  </div>
                  {lastScan.user && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-medium">{lastScan.user}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={lastScan.result === 'success' ? 'default' : 'destructive'}>
                      {lastScan.result === 'success' ? 'Success' : 'Denied'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="font-medium text-right">{lastScan.message}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatFriendlyTimestamp(lastScan.timestamp)}</span>
                  </div>
                  {lastScan.override && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Override:</span>
                      <Badge variant="secondary" className="text-xs">
                        Admin Override Active
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Sidebar */}
        <div className="space-y-4">
          {/* Admin Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Admin Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mode:</span>
                <Badge variant="default">Admin</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Override:</span>
                <Badge variant={overrideMode ? 'default' : 'secondary'}>
                  {overrideMode ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Scanner:</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Admin Session Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admin Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Processed:</span>
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
                <span className="text-sm">Overrides:</span>
                <span className="font-medium text-orange-600">{stats.overrides}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate:</span>
                <span className="font-medium text-blue-600">
                  {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Admin Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No admin activity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                View Access Logs
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Export Session Data
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Reset Statistics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
