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

interface ReceiptItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price?: number;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    warehouse_id: '',
    supplier_id: '',
    schedule_date: '',
    notes: '',
  });
  
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchSuppliers();
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

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
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

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.quantity) {
      toast({
        title: 'Error',
        description: 'Please select a product and enter quantity',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product_id));
    if (!product) return;

    const item: ReceiptItem = {
      product_id: parseInt(newItem.product_id),
      product_name: product.name,
      sku: product.sku,
      quantity: parseInt(newItem.quantity),
      unit_price: newItem.unit_price ? parseFloat(newItem.unit_price) : undefined,
    };

    setItems([...items, item]);
    setNewItem({ product_id: '', quantity: '', unit_price: '' });
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
      const response = await api.post('/receipts', {
        warehouse_id: parseInt(formData.warehouse_id),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        schedule_date: formData.schedule_date || null,
        notes: formData.notes || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price || null,
        })),
      });

      toast({
        title: 'Success',
        description: 'Receipt created successfully',
      });
      
      router.push(`/receipts/${response.data.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create receipt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/receipts');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">New Receipt</h1>
        <Button variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
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
              <div>
                <Label>Receive From</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsible</Label>
                <Input
                  value={user?.full_name || user?.username || ''}
                  disabled
                />
              </div>
              <div>
                <Label>Schedule Date</Label>
                <Input
                  type="date"
                  value={formData.schedule_date}
                  onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit_price ? `$${item.unit_price}` : 'N/A'}</TableCell>
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
                  ))}
                </TableBody>
              </Table>

              <div className="border-t pt-4">
                <div className="grid grid-cols-4 gap-4">
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
                  <div>
                    <Label>Unit Price (optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
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
            {loading ? 'Creating...' : 'Create Receipt'}
          </Button>
        </div>
      </form>
    </div>
  );
}
