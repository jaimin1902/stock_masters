'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, List, LayoutGrid, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function MoveHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/move-history?limit=200');
      setHistory(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load transaction history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.reference_number?.toLowerCase().includes(term) ||
      item.contact_name?.toLowerCase().includes(term) ||
      item.from_location?.toLowerCase().includes(term) ||
      item.to_location?.toLowerCase().includes(term) ||
      item.product_name?.toLowerCase().includes(term) ||
      item.transaction_type?.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'done':
      case 'validated':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'N/A';
    switch (status.toLowerCase()) {
      case 'draft':
        return 'Draft';
      case 'waiting':
        return 'Waiting';
      case 'ready':
        return 'Ready';
      case 'done':
      case 'validated':
      case 'completed':
        return 'Done';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const getDetailLink = (item: any) => {
    if (item.transaction_type === 'receipt') {
      return `/receipts/${item.reference_id}`;
    } else if (item.transaction_type === 'delivery') {
      return `/delivery-orders/${item.reference_id}`;
    } else if (item.transaction_type === 'transfer_out' || item.transaction_type === 'transfer_in') {
      return `/transfers/${item.reference_id}`;
    } else if (item.transaction_type === 'adjustment') {
      return `/adjustments/${item.reference_id}`;
    }
    return null;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transaction History</h1>
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by reference, contact, from, to..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
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
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No transaction history found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item: any) => {
                    const detailLink = getDetailLink(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.reference_number || `WH/${item.transaction_type.toUpperCase()}/${item.reference_id.toString().padStart(4, '0')}`}
                        </TableCell>
                        <TableCell>{item.from_location || 'N/A'}</TableCell>
                        <TableCell>{item.to_location || 'N/A'}</TableCell>
                        <TableCell>{item.contact_name || item.performed_by_name || 'N/A'}</TableCell>
                        <TableCell>
                          {item.schedule_date
                            ? new Date(item.schedule_date).toLocaleDateString()
                            : new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {detailLink ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={detailLink}>View</Link>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
