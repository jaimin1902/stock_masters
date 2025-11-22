'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Truck, ArrowLeftRight, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OperationsPage() {
  const operations = [
    {
      href: '/receipts',
      title: 'Receipts',
      description: 'Manage incoming stock from vendors',
      icon: Inbox,
      color: 'text-blue-600',
    },
    {
      href: '/delivery-orders',
      title: 'Delivery Orders',
      description: 'Manage outgoing stock for customer shipments',
      icon: Truck,
      color: 'text-green-600',
    },
    {
      href: '/transfers',
      title: 'Internal Transfers',
      description: 'Move stock between warehouses and locations',
      icon: ArrowLeftRight,
      color: 'text-purple-600',
    },
    {
      href: '/adjustments',
      title: 'Stock Adjustments',
      description: 'Fix discrepancies between recorded and physical stock',
      icon: SlidersHorizontal,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Operations</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {operations.map((operation) => {
          const Icon = operation.icon;
          return (
            <Card key={operation.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className={`h-8 w-8 ${operation.color}`} />
                  <CardTitle>{operation.title}</CardTitle>
                </div>
                <CardDescription>{operation.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={operation.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

