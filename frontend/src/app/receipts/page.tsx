'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const receiptSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  supplier_id: z.string().optional(),
  schedule_date: z.string().optional(),
  notes: z.string().optional(),
});

type ReceiptForm = z.infer<typeof receiptSchema>;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchReceipts();
    fetchWarehouses();
    fetchSuppliers();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load receipts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data);
    } catch (error: any) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data);
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await api.post(`/receipts/${id}/validate`);
      toast({
        title: 'Success',
        description: 'Receipt validated successfully',
      });
      fetchReceipts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to validate receipt',
        variant: 'destructive',
      });
    }
  };

  const filteredReceipts = receipts.filter((receipt: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      receipt.receipt_number?.toLowerCase().includes(term) ||
      receipt.supplier_name?.toLowerCase().includes(term) ||
      receipt.warehouse_name?.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Receipts</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/receipts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Receipt
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by reference, supplier, or warehouse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipt List</CardTitle>
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
                {filteredReceipts.map((receipt: any) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{receipt.supplier_name || 'N/A'}</TableCell>
                    <TableCell>{receipt.warehouse_name}</TableCell>
                    <TableCell>{receipt.supplier_name || 'N/A'}</TableCell>
                    <TableCell>
                      {receipt.schedule_date 
                        ? new Date(receipt.schedule_date).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(receipt.status)}`}>
                        {receipt.status === 'draft' ? 'Draft' : 
                         receipt.status === 'ready' ? 'Ready' : 
                         receipt.status === 'done' || receipt.status === 'validated' ? 'Done' : 
                         receipt.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/receipts/${receipt.id}`}>View</Link>
                        </Button>
                        {(receipt.status === 'pending' || receipt.status === 'ready') && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleValidate(receipt.id)}
                          >
                            {receipt.status === 'ready' ? 'Validate' : 'To DO'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
