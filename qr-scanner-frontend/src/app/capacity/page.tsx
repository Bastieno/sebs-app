'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useCapacityData, useCurrentOccupants, useTodaysStats } from '@/hooks/useApi';

export default function Capacity() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: capacityResponse, refetch: refetchCapacity } = useCapacityData();
  const { data: occupants, refetch: refetchOccupants } = useCurrentOccupants();
  const { data: todaysStats, refetch: refetchStats } = useTodaysStats();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchCapacity(), refetchOccupants(), refetchStats()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate capacity metrics from API data
  const capacityData = {
    current: capacityResponse?.success ? capacityResponse.data.totalCurrentOccupancy : 0,
    maximum: capacityResponse?.success ? capacityResponse.data.totalCapacity : 0,
    percentage: capacityResponse?.success && capacityResponse.data.totalCapacity > 0 
      ? Math.round((capacityResponse.data.totalCurrentOccupancy / capacityResponse.data.totalCapacity) * 100) 
      : 0,
    trend: 'stable' as const,
    lastUpdated: new Date(),
    peakToday: todaysStats?.totalEntries || 0,
    peakTime: 'N/A',
    avgDuration: 'N/A', // Would need additional calculation from logs
    turnoverRate: 0 // Would need additional calculation
  };

  const currentOccupants = occupants || [];


  const getCapacityStatus = (percentage: number) => {
    if (percentage >= 90) return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 75) return { status: 'high', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (percentage >= 50) return { status: 'moderate', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { status: 'low', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const { status, color, bgColor } = getCapacityStatus(capacityData.percentage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capacity Monitor</h1>
          <p className="text-gray-600 mt-2">
            Real-time facility occupancy and capacity management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Current Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-2 ${bgColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityData.current}/{capacityData.maximum}</div>
            <p className={`text-xs ${color} font-medium`}>
              {capacityData.percentage}% capacity ({status})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityData.peakToday}</div>
            <p className="text-xs text-muted-foreground">
              at {capacityData.peakTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityData.avgDuration}</div>
            <p className="text-xs text-muted-foreground">
              per visit today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityData.turnoverRate}x</div>
            <p className="text-xs text-muted-foreground">
              visitors per seat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Status Alert */}
      {capacityData.percentage >= 75 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  High Capacity Alert
                </p>
                <p className="text-sm text-yellow-700">
                  Current occupancy is at {capacityData.percentage}%. Consider managing entry flow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Occupants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Occupants ({capacityData.current})
            </CardTitle>
            <CardDescription>
              People currently in the facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentOccupants.map((occupant) => (
                <div key={occupant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {occupant.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{occupant.name}</p>
                      <p className="text-sm text-gray-600">{occupant.plan} Plan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{occupant.duration}</p>
                    <p className="text-xs text-gray-600">since {occupant.entryTime}</p>
                  </div>
                </div>
              ))}
              
              {currentOccupants.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No current occupants</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Capacity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today&apos;s Capacity Timeline
            </CardTitle>
            <CardDescription>
              Occupancy by time slot and plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No timeline data available</p>
              <p className="text-sm text-gray-500">Capacity timeline will show when data is available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Management</CardTitle>
          <CardDescription>
            Actions to manage facility capacity and flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Set Capacity Alert</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Configure alerts for high capacity situations
              </p>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Manage Limits</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Adjust capacity limits by plan type
              </p>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">View Analytics</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Detailed capacity reports and trends
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {capacityData.lastUpdated.toLocaleString()}</p>
      </div>
    </div>
  );
}
