'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Users, Clock, LineChart, Lock, LogOut } from 'lucide-react';
import { getUserAnalytics } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

// These should be environment variables in a real application
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123'
};

interface UserAnalytics {
  userId: string;
  username: string;
  email: string;
  lastActive: string;
  timeSpent: number;
  pageVisits: {
    page: string;
    timeSpent: number;
  }[];
}

const mockAnalytics: UserAnalytics[] = [
  {
    userId: '1',
    username: 'user1',
    email: 'user1@example.com',
    lastActive: new Date().toISOString(),
    timeSpent: 120,
    pageVisits: [
      { page: 'Video Editor', timeSpent: 60 },
      { page: 'Script Writer', timeSpent: 60 }
    ]
  },
  {
    userId: '2',
    username: 'user2',
    email: 'user2@example.com',
    lastActive: new Date().toISOString(),
    timeSpent: 90,
    pageVisits: [
      { page: 'Video Editor', timeSpent: 45 },
      { page: 'Script Writer', timeSpent: 45 }
    ]
  }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>(mockAnalytics);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (credentials.username === DEFAULT_ADMIN.username && credentials.password === DEFAULT_ADMIN.password) {
      setIsAuthenticated(true);
      setCredentials({ username: '', password: '' });
    } else {
      toast({
        title: 'Error',
        description: 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="space-y-4">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Admin Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      username: e.target.value
                    }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Login to Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
          <Button 
            variant="ghost" 
            className="w-full text-sm text-muted-foreground hover:text-primary"
            onClick={() => router.push('/login')}
          >
            ← Back to Vision Vox Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            setIsAuthenticated(false);
            setCredentials({ username: '', password: '' });
          }}
          className="text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAnalytics.filter(u => new Date(u.lastActive).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(userAnalytics.reduce((acc, u) => acc + u.timeSpent, 0) / userAnalytics.length || 0)}m
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Used Feature</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Video Editor</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>User Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="features">Feature Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Time Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAnalytics.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.lastActive).toLocaleString()}</TableCell>
                      <TableCell>{user.timeSpent} minutes</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="activity">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAnalytics.flatMap((user) =>
                    user.pageVisits.map((visit, index) => (
                      <TableRow key={`${user.userId}-${index}`}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{visit.page}</TableCell>
                        <TableCell>{visit.timeSpent} minutes</TableCell>
                        <TableCell>{new Date(user.lastActive).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="features">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Total Users</TableHead>
                    <TableHead>Total Time Spent</TableHead>
                    <TableHead>Avg. Time per User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    userAnalytics.flatMap(u => u.pageVisits)
                      .reduce((acc, visit) => ({
                        ...acc,
                        [visit.page]: {
                          users: (acc[visit.page]?.users || 0) + 1,
                          timeSpent: (acc[visit.page]?.timeSpent || 0) + visit.timeSpent
                        }
                      }), {} as Record<string, { users: number; timeSpent: number }>)
                  ).map(([feature, stats]) => (
                    <TableRow key={feature}>
                      <TableCell>{feature}</TableCell>
                      <TableCell>{stats.users}</TableCell>
                      <TableCell>{stats.timeSpent} minutes</TableCell>
                      <TableCell>{Math.round(stats.timeSpent / stats.users)} minutes</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
