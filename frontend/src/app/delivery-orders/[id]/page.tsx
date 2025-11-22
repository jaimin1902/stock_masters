'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Printer, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function DeliveryOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer_address: '',
    responsible: '',
    schedule_date: '',
    operation_type: '',
  });

  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchOrder();
      fetchProducts();
    }
  }, [params.id]);

  useEffect(() => {
    if (order && user) {
      setFormData({
        customer_address: order.customer_address || '',
        responsible: order.responsible_name || user.full_name || user.username || '',
        schedule_date: order.schedule_date
          ? new Date(order.schedule_date).toISOString().split('T')[0]
          : '',
        operation_type: order.operation_type || '',
      });
    }
  }, [order, user]);

  // Check stock and update status to waiting if needed (only once when order loads)
  useEffect(() => {
    if (order?.items && order.status === 'draft') {
      const hasOutOfStock = order.items.some((item: any) => 
        (item.available_stock || 0) < item.quantity
      );
      if (hasOutOfStock) {
        // Automatically set status to waiting if products are out of stock
        handleStatusChange('waiting');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/delivery-orders/${params.id}`);
      setOrder(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load delivery order',
        variant: 'destructive',
      });
      router.push('/delivery-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/delivery-orders/${params.id}`, {
        customer_address: formData.customer_address || null,
        schedule_date: formData.schedule_date || null,
        operation_type: formData.operation_type || null,
        responsible: user?.id || null,
      });
      toast({
        title: 'Success',
        description: 'Delivery order updated successfully',
      });
      fetchOrder();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update delivery order',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newItem.product_id || !newItem.quantity) {
      toast({
        title: 'Error',
        description: 'Please select a product and enter quantity',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Note: This would require a backend endpoint to add items to an existing order
      // For now, we'll show a message
      toast({
        title: 'Info',
        description: 'Adding products to existing orders requires backend support. Please create a new order.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add product',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.patch(`/delivery-orders/${params.id}/status`, { status });
      toast({
        title: 'Success',
        description: `Status updated to ${status}`,
      });
      fetchOrder();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleToDo = async () => {
    // Move from draft to waiting (or ready if all products are in stock)
    if (order?.items) {
      const hasOutOfStock = order.items.some((item: any) => 
        (item.available_stock || 0) < item.quantity
      );
      const newStatus = hasOutOfStock ? 'waiting' : 'ready';
      await handleStatusChange(newStatus);
    } else {
      await handleStatusChange('waiting');
    }
  };

  const handleValidate = async () => {
    try {
      await api.post(`/delivery-orders/${params.id}/validate`);
      toast({
        title: 'Success',
        description: 'Delivery order validated successfully. Stock updated.',
      });
      fetchOrder();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to validate delivery order',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = () => {
    router.push('/delivery-orders');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!order) {
    return <div className="p-8">Delivery order not found</div>;
  }

  const isDraft = order.status === 'draft';
  const isWaiting = order.status === 'waiting';
  const isReady = order.status === 'ready';
  const isDone = order.status === 'done';
  const canEdit = isDraft || isWaiting || isReady;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="outline" className="mb-2 border-red-500 text-red-500 hover:bg-red-50" asChild>
            <Link href="/delivery-orders/new">NEW</Link>
          </Button>
          <h1 className="text-3xl font-bold text-red-600">Delivery</h1>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button onClick={handleToDo}>
              To DO
            </Button>
          )}
          {isWaiting && (
            <Button onClick={() => handleStatusChange('ready')}>
              Mark Ready
            </Button>
          )}
          {isReady && (
            <Button onClick={handleValidate}>
              Validate
            </Button>
          )}
          {isDone && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Status Flow */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded border">
          <span className={`px-3 py-1 rounded text-sm ${
            isDraft
              ? 'bg-blue-100 text-blue-800 font-semibold'
              : 'bg-gray-100 text-gray-600'
          }`}>
            Draft
          </span>
          <span>&gt;</span>
          <span className={`px-3 py-1 rounded text-sm ${
            isWaiting
              ? 'bg-orange-100 text-orange-800 font-semibold'
              : isReady || isDone
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            Waiting
          </span>
          <span>&gt;</span>
          <span className={`px-3 py-1 rounded text-sm ${
            isReady
              ? 'bg-yellow-100 text-yellow-800 font-semibold'
              : isDone
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            Ready
          </span>
          <span>&gt;</span>
          <span className={`px-3 py-1 rounded text-sm ${
            isDone
              ? 'bg-green-100 text-green-800 font-semibold'
              : 'bg-gray-100 text-gray-600'
          }`}>
            Done
          </span>
        </div>
        <div className="text-xs text-muted-foreground ml-4">
          <div>Draft: Initial state</div>
          <div>Waiting: Waiting for the out of stock product to be in</div>
          <div>Ready: Ready to deliver/receive</div>
          <div>Done: Received or delivered</div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reference</Label>
              <Input value={order.order_number} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Address</Label>
                {canEdit ? (
                  <Input
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    onBlur={handleSave}
                    placeholder="Enter delivery address"
                  />
                ) : (
                  <Input value={order.customer_address || 'N/A'} disabled />
                )}
              </div>
              <div>
                <Label>Responsible</Label>
                <Input 
                  value={formData.responsible} 
                  disabled 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Schedule Date</Label>
                {canEdit ? (
                  <Input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                    onBlur={handleSave}
                  />
                ) : (
                  <Input
                    type="date"
                    value={formData.schedule_date}
                    disabled
                  />
                )}
              </div>
              <div>
                <Label>Operation Type</Label>
                {canEdit ? (
                  <Select
                    value={formData.operation_type || undefined}
                    onValueChange={(value) => {
                      setFormData({ ...formData, operation_type: value });
                      handleSave();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_shipment">Customer Shipment</SelectItem>
                      <SelectItem value="internal_transfer">Internal Transfer</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={order.operation_type || 'N/A'} disabled />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item: any) => {
                const availableStock = item.available_stock || 0;
                const isOutOfStock = availableStock < item.quantity;
                return (
                  <TableRow
                    key={item.id}
                    className={isOutOfStock ? 'bg-red-50 hover:bg-red-100 border-red-200' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">[{item.sku}]</span>
                        <span>{item.product_name}</span>
                        {isOutOfStock && (
                          <span className="text-xs text-red-600 font-semibold ml-2">
                            ⚠️ Insufficient Stock: {availableStock} available, {item.quantity} required
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={isOutOfStock ? 'text-red-600 font-semibold' : ''}>
                      {item.quantity} {item.unit_of_measure || ''}
                    </TableCell>
                  </TableRow>
                );
              })}
              {canEdit && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <div className="grid grid-cols-4 gap-4 py-2">
                      <div>
                        <Label>New Product</Label>
                        <Select
                          value={newItem.product_id}
                          onValueChange={(value) => setNewItem({ ...newItem, product_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                [{product.sku}] {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          placeholder="Quantity"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddProduct} className="w-full">
                          Add New Product
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

