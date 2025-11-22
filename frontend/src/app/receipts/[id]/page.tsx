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

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplier_id: '',
    schedule_date: '',
    responsible: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchReceipt();
      fetchSuppliers();
    }
  }, [params.id]);

  useEffect(() => {
    if (receipt && user) {
      setFormData({
        supplier_id: receipt.supplier_id?.toString() || '',
        schedule_date: receipt.schedule_date 
          ? new Date(receipt.schedule_date).toISOString().split('T')[0] 
          : '',
        responsible: user.full_name || user.username || '',
      });
    }
  }, [receipt, user]);

  const fetchReceipt = async () => {
    try {
      const response = await api.get(`/receipts/${params.id}`);
      setReceipt(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load receipt',
        variant: 'destructive',
      });
      router.push('/receipts');
    } finally {
      setLoading(false);
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

  const handleSave = async (updates?: { supplier_id?: string; schedule_date?: string }) => {
    setSaving(true);
    try {
      const dataToSave = updates || formData;
      await api.put(`/receipts/${params.id}`, {
        supplier_id: dataToSave.supplier_id && dataToSave.supplier_id !== '' 
          ? parseInt(dataToSave.supplier_id) 
          : null,
        schedule_date: dataToSave.schedule_date || null,
      });
      toast({
        title: 'Success',
        description: 'Receipt updated successfully',
      });
      fetchReceipt();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update receipt',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTodo = async () => {
    try {
      await api.patch(`/receipts/${params.id}/status`, { status: 'ready' });
      toast({
        title: 'Success',
        description: 'Receipt moved to Ready status',
      });
      fetchReceipt();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleValidate = async () => {
    try {
      await api.post(`/receipts/${params.id}/validate`);
      toast({
        title: 'Success',
        description: 'Receipt validated successfully. Stock updated.',
      });
      fetchReceipt();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to validate receipt',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = () => {
    router.push('/receipts');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!receipt) {
    return <div className="p-8">Receipt not found</div>;
  }

  const isDraft = receipt.status === 'draft' || receipt.status === 'pending';
  const isReady = receipt.status === 'ready';
  const isDone = receipt.status === 'validated' || receipt.status === 'done';
  const canEdit = isDraft || isReady;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="outline" className="mb-2">
            NEW
          </Button>
          <h1 className="text-3xl font-bold">Receipt</h1>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button onClick={handleTodo}>
              To DO
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
        <span className={`px-3 py-1 rounded text-sm ${
          isDraft
            ? 'bg-blue-100 text-blue-800 font-semibold' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          Draft
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Receipt Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reference</Label>
              <Input value={receipt.receipt_number} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Receive From</Label>
                {canEdit ? (
                  <Select
                    value={formData.supplier_id || undefined}
                    onValueChange={(value) => {
                      setFormData({ ...formData, supplier_id: value });
                      handleSave({ ...formData, supplier_id: value });
                    }}
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
                ) : (
                  <Input value={receipt.supplier_name || 'N/A'} disabled />
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
              <div>
                <Label>Schedule Date</Label>
                {canEdit ? (
                  <Input 
                    type="date" 
                    value={formData.schedule_date}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, schedule_date: newValue });
                    }}
                    onBlur={() => handleSave({ ...formData, schedule_date: formData.schedule_date })}
                  />
                ) : (
                  <Input 
                    type="date" 
                    value={formData.schedule_date} 
                    disabled 
                  />
                )}
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
              {receipt.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    [{item.sku}] {item.product_name}
                  </TableCell>
                  <TableCell>{item.quantity} {item.unit_of_measure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

