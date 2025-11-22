'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/transfers');
      setTransfers(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load transfers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Internal Transfers</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer Number</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{transfer.transfer_number}</TableCell>
                    <TableCell>{transfer.from_warehouse_name}</TableCell>
                    <TableCell>{transfer.to_warehouse_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        transfer.status === 'validated' ? 'bg-green-100 text-green-800' :
                        transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transfer.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {transfer.status === 'pending' && (
                        <Button variant="outline" size="sm">Validate</Button>
                      )}
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

