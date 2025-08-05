'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield,
  ScanLine,
  UserPlus,
  UserMinus,
  Search,
  Settings,
  AlertTriangle,
  Clock,
  Key,
  Lock,
  Unlock
} from 'lucide-react';

export default function AdminScanner() {
  const [manualEntry, setManualEntry] = useState({
    userId: '',
    action: 'ENTRY' as 'ENTRY' | 'EXIT',
    reason: ''
  });
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
    lastAccess: string;
    currentlyInside: boolean;
  } | null>(null);

  // Mock user search results
  const searchResults = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      plan: 'Premium Plan',
      status: 'active',
      lastAccess: '2 hours ago',
      currentlyInside: true
    },
    {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      plan: 'Standard Plan', 
      status: 'active',
      lastAccess: '5 hours ago',
      currentlyInside: false
    }
  ];

  // Mock recent admin actions
  const recentActions = [
    {
      id: 1,
      admin: 'Admin User',
      action: 'Manual Entry',
      user: 'John Doe',
      timestamp: '5 min ago',
      reason: 'Lost QR code'
    },
    {
      id: 2,
      admin: 'Admin User', 
      action: 'Override Exit',
      user: 'Jane Smith',
      timestamp: '15 min ago',
      reason: 'Emergency evacuation'
    }
  ];

  const handleManualAction = (action: 'ENTRY' | 'EXIT') => {
    if (!selectedUser) return;
    
    // Mock API call
    console.log(`Manual ${action} for user:`, selectedUser.name, 'Reason:', manualEntry.reason);
    
    // Reset form
    setManualEntry({ userId: '', action: 'ENTRY', reason: '' });
    setSelectedUser(null);
  };

  const handleUserSearch = (query: string) => {
    setSearchUser(query);
    // In real implementation, this would trigger API search
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Scanner</h1>
            <p className="text-gray-600 mt-2">
              Administrative access control and manual overrides
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          Admin Mode
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Currently inside</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Actions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overrides</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">2</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Search & Manual Entry */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                User Search
              </CardTitle>
              <CardDescription>
                Search for users to perform manual actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userSearch">Search by name or email</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="userSearch"
                    placeholder="Enter user name or email..."
                    value={searchUser}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchUser && (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  {searchResults
                    .filter(user => 
                      user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchUser.toLowerCase())
                    )
                    .map((user) => (
                      <div 
                        key={user.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.plan}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={user.currentlyInside ? 'default' : 'secondary'}>
                              {user.currentlyInside ? 'Inside' : 'Outside'}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{user.lastAccess}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Actions */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Manual Actions
                </CardTitle>
                <CardDescription>
                  Perform manual entry/exit for {selectedUser.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason for manual action</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Lost QR code, System issue..."
                    value={manualEntry.reason}
                    onChange={(e) => setManualEntry({...manualEntry, reason: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleManualAction('ENTRY')}
                    disabled={!manualEntry.reason}
                    className="flex-1"
                    variant={selectedUser.currentlyInside ? 'outline' : 'default'}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Manual Entry
                  </Button>
                  <Button 
                    onClick={() => handleManualAction('EXIT')}
                    disabled={!manualEntry.reason}
                    className="flex-1"
                    variant={selectedUser.currentlyInside ? 'default' : 'outline'}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Manual Exit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Admin Actions & QR Scanner */}
        <div className="space-y-4">
          {/* QR Scanner for Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Admin QR Scanner
              </CardTitle>
              <CardDescription>
                Scan QR codes with admin privileges
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <ScanLine className="h-16 w-16 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium">Admin Scanner Ready</p>
                <p className="text-gray-600">Bypass time restrictions and capacity limits</p>
              </div>
              <Button size="lg" className="w-full">
                <ScanLine className="h-4 w-4 mr-2" />
                Start Admin Scan
              </Button>
            </CardContent>
          </Card>

          {/* Recent Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Admin Actions
              </CardTitle>
              <CardDescription>
                Latest administrative interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{action.action}</p>
                        <p className="text-sm text-gray-600">for {action.user}</p>
                        <p className="text-xs text-gray-500">{action.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{action.timestamp}</p>
                      <p className="text-xs text-gray-600">{action.admin}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Emergency Actions */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Emergency Actions
          </CardTitle>
          <CardDescription>
            Emergency overrides and system controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start border-red-200 hover:bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Unlock className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700">Emergency Unlock</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Override all access controls for emergency situations
              </p>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start border-red-200 hover:bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <UserMinus className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700">Mass Evacuation</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Mark all users as exited for emergency evacuation
              </p>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start border-red-200 hover:bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700">System Lockdown</span>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Prevent all new entries while allowing exits
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
