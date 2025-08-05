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

export default function Capacity() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - will be replaced with real API data
  const capacityData = {
    current: 18,
    maximum: 50,
    percentage: 36,
    trend: 'up', // 'up', 'down', 'stable'
    lastUpdated: new Date(),
    peakToday: 32,
    peakTime: '2:30 PM',
    avgDuration: '3h 45m',
    turnoverRate: 2.3
  };

  const currentOccupants = [
    { id: 1, name: 'John Doe', plan: 'Premium', entryTime: '08:30 AM', duration: '6h 15m' },
    { id: 2, name: 'Jane Smith', plan: 'Standard', entryTime: '10:15 AM', duration: '4h 30m' },
    { id: 3, name: 'Mike Johnson', plan: 'Morning', entryTime: '09:00 AM', duration: '5h 45m' },
    { id: 4, name: 'Sarah Wilson', plan: 'Premium', entryTime: '11:45 AM', duration: '3h 00m' },
    { id: 5, name: 'David Brown', plan: 'Afternoon', entryTime: '12:30 PM', duration: '2h 15m' },
  ];

  const timeSlots = [
    { time: '8 AM', morning: 12, afternoon: 0, night: 0, total: 12 },
    { time: '10 AM', morning: 15, afternoon: 0, night: 0, total: 15 },
    { time: '12 PM', morning: 8, afternoon: 12, night: 0, total: 20 },
    { time: '2 PM', morning: 4, afternoon: 18, night: 0, total: 22 },
    { time: '4 PM', morning: 2, afternoon: 20, night: 0, total: 22 },
    { time: '6 PM', morning: 0, afternoon: 15, night: 8, total: 23 },
    { time: '8 PM', morning: 0, afternoon: 8, night: 15, total: 23 },
    { time: '10 PM', morning: 0, afternoon: 4, night: 18, total: 22 },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Mock refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

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
            <div className="space-y-4">
              {timeSlots.map((slot, index) => {
                const percentage = Math.round((slot.total / capacityData.maximum) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{slot.time}</span>
                      <span className="text-sm text-gray-600">{slot.total}/50</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Morning: {slot.morning}</span>
                      <span>Afternoon: {slot.afternoon}</span>
                      <span>Night: {slot.night}</span>
                    </div>
                  </div>
                );
              })}
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
