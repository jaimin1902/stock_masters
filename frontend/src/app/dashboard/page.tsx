'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Truck, AlertTriangle, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchDashboard();
    
    // Set up socket for real-time updates
    const socket = getSocket();
    socket.on('stock-updated', () => {
      fetchDashboard();
    });

    return () => {
      socket.off('stock-updated');
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      console.log("🚀 ~ fetchDashboard ~ response:", response)
      setData(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const summary = data?.summary || {};
  const pendingReceipts = data?.pendingReceipts || [];
  const pendingDeliveryOrders = data?.pendingDeliveryOrders || [];

  // Calculate late receipts (schedule date < today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lateReceipts = pendingReceipts.filter((r: any) => {
    if (!r.schedule_date) return false;
    const scheduleDate = new Date(r.schedule_date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate < today;
  }).length;

  // Calculate operations (schedule date > today)
  const operationsReceipts = pendingReceipts.filter((r: any) => {
    if (!r.schedule_date) return true; // If no schedule date, count as operation
    const scheduleDate = new Date(r.schedule_date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate >= today;
  }).length;

  const lateDeliveries = pendingDeliveryOrders.filter((d: any) => {
    if (!d.schedule_date) return false;
    const scheduleDate = new Date(d.schedule_date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate < today;
  }).length;

  // Calculate operations (schedule date > today)
  const operationsDeliveries = pendingDeliveryOrders.filter((d: any) => {
    if (!d.schedule_date) return true; // If no schedule date, count as operation
    const scheduleDate = new Date(d.schedule_date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate >= today;
  }).length;

  // Calculate waiting deliveries (waiting for stock)
  const waitingDeliveries = pendingDeliveryOrders.filter((d: any) => {
    return d.status === 'pending' || d.status === 'waiting';
  }).length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary.totalLowStockItems || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingReceipts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingDeliveryOrders || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Receipts Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Receipt</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/receipts">{pendingReceipts.length} to receive</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lateReceipts > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-destructive font-semibold">{lateReceipts} Late</span>
                  <span className="text-xs text-muted-foreground">(schedule date &lt; today)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold">{operationsReceipts} Operations</span>
                <span className="text-xs text-muted-foreground">(schedule date &gt; today)</span>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href="/receipts">View Receipts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Delivery</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/delivery-orders">{pendingDeliveryOrders.length} to Deliver</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lateDeliveries > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-destructive font-semibold">{lateDeliveries} Late</span>
                  <span className="text-xs text-muted-foreground">(schedule date &lt; today)</span>
                </div>
              )}
              {waitingDeliveries > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 font-semibold">{waitingDeliveries} Waiting</span>
                  <span className="text-xs text-muted-foreground">(waiting for stocks)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold">{operationsDeliveries} Operations</span>
                <span className="text-xs text-muted-foreground">(schedule date &gt; today)</span>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href="/delivery-orders">View Deliveries</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {data?.lowStockAlerts && data.lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products that need reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.lowStockAlerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{alert.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.warehouse_name} - Stock: {alert.quantity} (Reorder: {alert.reorder_level})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
