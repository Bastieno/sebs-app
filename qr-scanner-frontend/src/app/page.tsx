'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ScanLine, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  RefreshCw 
} from 'lucide-react';
import { useTodaysStats, useCapacityData, useHealthCheck } from '@/hooks/useApi';

export default function Dashboard() {
  const { data: todaysStats, loading: statsLoading, error: statsError, refetch: refetchStats } = useTodaysStats();
  const { data: capacityData, loading: capacityLoading, error: capacityError, refetch: refetchCapacity } = useCapacityData();
  const { loading: healthLoading, error: healthError, refetch: refetchHealth } = useHealthCheck();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchCapacity(), refetchHealth()]);
    setLastRefresh(new Date());
  };

  // Determine system status based on API connectivity and health check
  const systemStatus = (statsError || capacityError || healthError) ? 'offline' : 'online';
  const isLoading = statsLoading || capacityLoading || healthLoading;
  
  const stats = {
    todayEntries: todaysStats?.totalEntries || 0,
    currentOccupancy: capacityData?.success ? capacityData.data.totalCurrentOccupancy : 0,
    totalCapacity: capacityData?.success ? capacityData.data.totalCapacity : 0,
    systemStatus,
    lastScanned: todaysStats?.lastScanTime || 'No recent activity'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to Seb&apos;s Hub QR Scanner System
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/scanner">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Scanner</CardTitle>
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Ready</div>
              <p className="text-xs text-muted-foreground">
                Start scanning QR codes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentOccupancy}/{stats.totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCapacity > 0 ? Math.round((stats.currentOccupancy / stats.totalCapacity) * 100) : 0}% occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayEntries}</div>
            <p className="text-xs text-muted-foreground">
              Total access attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            System Status
            {stats.systemStatus === 'online' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Current system health and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scanner Status</span>
              <Badge variant={stats.systemStatus === 'online' ? 'default' : 'destructive'}>
                {stats.systemStatus === 'online' ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Activity</span>
              <span className="text-sm text-muted-foreground">{stats.lastScanned}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backend Connection</span>
              <Badge variant={stats.systemStatus === 'online' ? 'default' : 'destructive'}>
                {stats.systemStatus === 'online' ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Refresh</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{lastRefresh.toLocaleTimeString()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {(statsError || capacityError || healthError) && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                <p className="font-medium mb-1">Connection Issues:</p>
                <ul className="text-xs space-y-1">
                  {statsError && <li>• Stats: {statsError}</li>}
                  {capacityError && <li>• Capacity: {capacityError}</li>}
                  {healthError && <li>• Health Check: {healthError}</li>}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Management</CardTitle>
            <CardDescription>
              Monitor and manage facility access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/access-logs">
              <Button variant="outline" className="w-full justify-between">
                View Access Logs
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/capacity">
              <Button variant="outline" className="w-full justify-between">
                Capacity Monitor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scanner Tools</CardTitle>
            <CardDescription>
              Advanced scanner features and admin tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/scanner">
              <Button className="w-full justify-between">
                Open Scanner
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/scanner/admin">
              <Button variant="outline" className="w-full justify-between">
                Admin Scanner
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
