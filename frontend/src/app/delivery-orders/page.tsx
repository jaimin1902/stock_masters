'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { LayoutGrid, List, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ViewMode = 'list' | 'kanban';

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/delivery-orders');
      setOrders(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load delivery orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(term) ||
      order.customer_name?.toLowerCase().includes(term) ||
      order.customer_address?.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'waiting':
        return 'Waiting';
      case 'ready':
        return 'Ready';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  // Group orders by status for kanban view
  const ordersByStatus = {
    draft: filteredOrders.filter((o: any) => o.status === 'draft'),
    waiting: filteredOrders.filter((o: any) => o.status === 'waiting'),
    ready: filteredOrders.filter((o: any) => o.status === 'ready'),
    done: filteredOrders.filter((o: any) => o.status === 'done'),
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" asChild>
            <Link href="/delivery-orders/new">NEW</Link>
          </Button>
          <h1 className="text-3xl font-bold text-red-600">Delivery</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Search Delivery based on reference & contacts"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('kanban')}
            title="Switch to kanban view based on status"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search by reference & contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Delivery List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Schedule Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No delivery orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.warehouse_name || 'WH/Stock1'}</TableCell>
                        <TableCell>{order.customer_address || order.customer_name || 'vendor'}</TableCell>
                        <TableCell>{order.customer_name || 'Azure Interior'}</TableCell>
                        <TableCell>
                          {order.schedule_date
                            ? new Date(order.schedule_date).toLocaleDateString()
                            : ''}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/delivery-orders/${order.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {['draft', 'waiting', 'ready', 'done'].map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold capitalize">{getStatusLabel(status)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ordersByStatus[status as keyof typeof ordersByStatus].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No orders</p>
                ) : (
                  ordersByStatus[status as keyof typeof ordersByStatus].map((order: any) => (
                    <Link key={order.id} href={`/delivery-orders/${order.id}`}>
                      <Card className="hover:bg-accent cursor-pointer">
                        <CardContent className="p-3">
                          <div className="font-medium text-sm">{order.order_number}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.customer_name || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.schedule_date
                              ? new Date(order.schedule_date).toLocaleDateString()
                              : 'No date'}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
