'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const response = await api.get('/adjustments');
      setAdjustments(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load adjustments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stock Adjustments</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Adjustment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead>Physical</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell>{adj.adjustment_number}</TableCell>
                    <TableCell>{adj.product_name}</TableCell>
                    <TableCell>{adj.warehouse_name}</TableCell>
                    <TableCell>{adj.recorded_quantity}</TableCell>
                    <TableCell>{adj.physical_quantity}</TableCell>
                    <TableCell className={adj.adjustment_quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {adj.adjustment_quantity >= 0 ? '+' : ''}{adj.adjustment_quantity}
                    </TableCell>
                    <TableCell>{new Date(adj.created_at).toLocaleDateString()}</TableCell>
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

