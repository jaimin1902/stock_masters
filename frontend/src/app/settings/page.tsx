'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Warehouse, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
});

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Short Code is required'),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
});

type WarehouseForm = z.infer<typeof warehouseSchema>;
type LocationForm = z.infer<typeof locationSchema>;

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warehouses' | 'locations'>('warehouses');
  const { toast } = useToast();
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

  const {
    register: registerWarehouse,
    handleSubmit: handleSubmitWarehouse,
    formState: { errors: warehouseErrors },
    reset: resetWarehouse,
  } = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
  });

  const {
    register: registerLocation,
    handleSubmit: handleSubmitLocation,
    formState: { errors: locationErrors },
    reset: resetLocation,
    setValue: setLocationValue,
    watch: watchLocation,
  } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
  });

  useEffect(() => {
    fetchWarehouses();
    fetchLocations();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load warehouses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load locations',
        variant: 'destructive',
      });
    }
  };

  const onSubmitWarehouse = async (data: WarehouseForm) => {
    try {
      await api.post('/warehouses', data);
      toast({
        title: 'Success',
        description: 'Warehouse created successfully',
      });
      setIsWarehouseDialogOpen(false);
      resetWarehouse();
      fetchWarehouses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create warehouse',
        variant: 'destructive',
      });
    }
  };

  const onSubmitLocation = async (data: LocationForm) => {
    try {
      await api.post('/locations', {
        ...data,
        warehouse_id: parseInt(data.warehouse_id),
      });
      toast({
        title: 'Success',
        description: 'Location created successfully',
      });
      setIsLocationDialogOpen(false);
      resetLocation();
      fetchLocations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create location',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'warehouses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Warehouse className="inline mr-2 h-4 w-4" />
          Warehouses
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'locations'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="inline mr-2 h-4 w-4" />
          Locations
        </button>
      </div>

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Warehouse Management</CardTitle>
                <CardDescription>Manage warehouse details and locations</CardDescription>
              </div>
              <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Warehouse
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Warehouse</DialogTitle>
                    <DialogDescription>
                      Create a new warehouse with name, code, and address.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitWarehouse(onSubmitWarehouse)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="warehouse-name">Name</Label>
                      <Input id="warehouse-name" {...registerWarehouse('name')} placeholder="Enter warehouse name" />
                      {warehouseErrors.name && (
                        <p className="text-sm text-destructive">{warehouseErrors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouse-code">Short Code</Label>
                      <Input id="warehouse-code" {...registerWarehouse('code')} placeholder="Enter short code" />
                      {warehouseErrors.code && (
                        <p className="text-sm text-destructive">{warehouseErrors.code.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouse-address">Address</Label>
                      <Input id="warehouse-address" {...registerWarehouse('address')} placeholder="Enter address" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsWarehouseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse: any) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.code}</TableCell>
                      <TableCell>{warehouse.name}</TableCell>
                      <TableCell>{warehouse.address || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {warehouse.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>location</CardTitle>
                <CardDescription>This holds the multiple locations of warehouse, rooms etc..</CardDescription>
              </div>
              <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>location</DialogTitle>
                    <DialogDescription>
                      Create a new location within a warehouse.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitLocation(onSubmitLocation)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location-name">Name</Label>
                      <Input id="location-name" {...registerLocation('name')} placeholder="Enter location name" />
                      {locationErrors.name && (
                        <p className="text-sm text-destructive">{locationErrors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location-code">Short Code</Label>
                      <Input id="location-code" {...registerLocation('code')} placeholder="Enter short code" />
                      {locationErrors.code && (
                        <p className="text-sm text-destructive">{locationErrors.code.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location-warehouse">warehouse</Label>
                      <Select
                        value={watchLocation('warehouse_id')}
                        onValueChange={(value) => setLocationValue('warehouse_id', value)}
                      >
                        <SelectTrigger id="location-warehouse">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse: any) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.code} - {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {locationErrors.warehouse_id && (
                        <p className="text-sm text-destructive">{locationErrors.warehouse_id.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No locations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location: any) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.code}</TableCell>
                        <TableCell>{location.name}</TableCell>
                        <TableCell>{location.warehouse_name} ({location.warehouse_code})</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            location.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {location.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
