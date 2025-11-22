'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { X, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_of_measure: string;
}

interface DeliveryItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  available_stock?: number;
}

export default function NewDeliveryOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    warehouse_id: '',
    customer_name: '',
    customer_address: '',
    schedule_date: '',
    operation_type: '',
    notes: '',
  });
  
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load warehouses:', error);
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

  const fetchProductStock = async (productId: number, warehouseId: number) => {
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data.data;
      const stock = product.stock?.find((s: any) => s.warehouse_id === warehouseId);
      return stock?.quantity || 0;
    } catch (error) {
      return 0;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.product_id || !newItem.quantity) {
      toast({
        title: 'Error',
        description: 'Please select a product and enter quantity',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.warehouse_id) {
      toast({
        title: 'Error',
        description: 'Please select a warehouse first',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product_id));
    if (!product) return;

    const availableStock = await fetchProductStock(parseInt(newItem.product_id), parseInt(formData.warehouse_id));

    const item: DeliveryItem = {
      product_id: parseInt(newItem.product_id),
      product_name: product.name,
      sku: product.sku,
      quantity: parseInt(newItem.quantity),
      available_stock: availableStock,
    };

    setItems([...items, item]);
    setNewItem({ product_id: '', quantity: '' });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.warehouse_id) {
      toast({
        title: 'Error',
        description: 'Please select a warehouse',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one product',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/delivery-orders', {
        warehouse_id: parseInt(formData.warehouse_id),
        customer_name: formData.customer_name || null,
        customer_address: formData.customer_address || null,
        schedule_date: formData.schedule_date || null,
        operation_type: formData.operation_type || null,
        responsible: user?.id || null,
        notes: formData.notes || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      toast({
        title: 'Success',
        description: 'Delivery order created successfully',
      });
      
      router.push(`/delivery-orders/${response.data.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create delivery order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/delivery-orders');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="outline" className="mb-2 border-red-500 text-red-500 hover:bg-red-50" asChild>
            <Link href="/delivery-orders">NEW</Link>
          </Button>
          <h1 className="text-3xl font-bold text-red-600">Delivery</h1>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Status Flow */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded border">
          <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800 font-semibold">
            Draft
          </span>
          <span>&gt;</span>
          <span className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-600">
            Waiting
          </span>
          <span>&gt;</span>
          <span className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-600">
            Ready
          </span>
          <span>&gt;</span>
          <span className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-600">
            Done
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Warehouse *</Label>
                <Select
                  value={formData.warehouse_id}
                  onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Address</Label>
                  <Input
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    placeholder="Enter delivery address"
                  />
                </div>
                <div>
                  <Label>Responsible</Label>
                  <Input
                    value={user?.full_name || user?.username || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Schedule Date</Label>
                  <Input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Operation Type</Label>
                  <Select
                    value={formData.operation_type}
                    onValueChange={(value) => setFormData({ ...formData, operation_type: value })}
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
                </div>
              </div>
              <div className="col-span-2">
                <Label>Customer Name</Label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const isOutOfStock = (item.available_stock || 0) < item.quantity;
                    return (
                      <TableRow
                        key={index}
                        className={isOutOfStock ? 'bg-red-50 hover:bg-red-100 border-red-200' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">[{item.sku}]</span>
                            <span>{item.product_name}</span>
                            {isOutOfStock && (
                              <span className="text-xs text-red-600 font-semibold ml-2">
                                ⚠️ Insufficient Stock: {item.available_stock} available
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={isOutOfStock ? 'text-red-600 font-semibold' : ''}>
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No products added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4">
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
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Product
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Delivery Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}

