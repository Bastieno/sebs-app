'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  History,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export default function AccessLogs() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const accessLogs = [
    {
      id: '1',
      timestamp: '2025-01-05T22:45:00Z',
      user: 'John Doe',
      action: 'ENTRY',
      result: 'SUCCESS',
      plan: 'Premium Plan',
    },
    {
      id: '2',
      timestamp: '2025-01-05T22:30:00Z',
      user: 'Jane Smith',
      action: 'EXIT',
      result: 'SUCCESS',
      plan: 'Standard Plan',
      duration: '4h 30m',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Access Logs</h1>
          <p className="text-gray-600 mt-2">
            Monitor and review access control activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Activity</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Total access attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing recent access logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">{log.user}</p>
                    <p className="text-sm text-gray-600">{log.plan}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="default">
                    {log.action}
                  </Badge>
                  
                  <Badge variant="default">
                    {log.result}
                  </Badge>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-600">{new Date(log.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
