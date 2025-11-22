'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, List, LayoutGrid, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
      const response = await api.get('/move-history?limit=100');
      setHistory(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load move history',
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
      item.product_name?.toLowerCase().includes(term) ||
      item.warehouse_name?.toLowerCase().includes(term) ||
      item.transaction_type?.toLowerCase().includes(term)
    );
  });

  const isInbound = (type: string) => {
    return type === 'receipt' || type === 'transfer_in' || type === 'adjustment' && 
           history.find((h: any) => h.id === (history as any).find((x: any) => x.transaction_type === type)?.id)?.quantity_change > 0;
  };

  const getRowColor = (item: any) => {
    if (item.transaction_type === 'receipt' || item.transaction_type === 'transfer_in') {
      return 'bg-green-50';
    }
    if (item.transaction_type === 'delivery' || item.transaction_type === 'transfer_out') {
      return 'bg-red-50';
    }
    return '';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Move History</h1>
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
          placeholder="Search by product, warehouse, or transaction type..."
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
                  <TableHead>Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
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
                    // Use reference_number from backend, fallback to generated reference
                    const reference = item.reference_number || (
                      item.transaction_type === 'receipt' 
                        ? `WH/IN/${item.reference_id.toString().padStart(4, '0')}`
                        : item.transaction_type === 'delivery'
                        ? `WH/OUT/${item.reference_id.toString().padStart(4, '0')}`
                        : item.transaction_type === 'transfer_out' || item.transaction_type === 'transfer_in'
                        ? `WH/TRF/${item.reference_id.toString().padStart(4, '0')}`
                        : `WH/ADJ/${item.reference_id.toString().padStart(4, '0')}`
                    );

                    // Get contact name from backend or use default
                    const contactName = item.contact_name || item.performed_by_name || 'System';

                    return (
                      <TableRow key={item.id} className={getRowColor(item)}>
                        <TableCell className="font-medium">{reference}</TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{contactName}</TableCell>
                        <TableCell>
                          {item.transaction_type === 'receipt' || item.transaction_type === 'transfer_in'
                            ? 'External'
                            : item.warehouse_name}
                        </TableCell>
                        <TableCell>
                          {item.transaction_type === 'delivery' || item.transaction_type === 'transfer_out'
                            ? 'External'
                            : item.warehouse_name}
                        </TableCell>
                        <TableCell className={item.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.quantity_change >= 0 ? '+' : ''}{item.quantity_change}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {item.transaction_type}
                          </span>
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
