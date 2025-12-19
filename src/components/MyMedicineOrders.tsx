import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Truck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MedicineOrder {
  id: string;
  medicines: string;
  delivery_address: string;
  phone: string;
  payment_method: string;
  is_urgent: boolean;
  status: string;
  notes: string;
  created_at: string;
  pharmacies: {
    pharmacy_name: string;
    phone: string;
  };
}

export const MyMedicineOrders = () => {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMyOrders();
    }
  }, [open]);

  const fetchMyOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get orders without foreign key join first
    const { data: ordersData, error: ordersError } = await supabase
      .from('medicine_orders')
      .select(`
        id,
        pharmacy_id,
        medicines,
        delivery_address,
        phone,
        payment_method,
        is_urgent,
        status,
        notes,
        created_at
      `)
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      setLoading(false);
      return;
    }

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Get pharmacy names separately
    const pharmacyIds = [...new Set(ordersData.map(order => order.pharmacy_id))];
    const { data: pharmaciesData } = await supabase
      .from('pharmacies')
      .select('id, pharmacy_name, phone')
      .in('id', pharmacyIds);

    // Combine the data
    const ordersWithPharmacies = ordersData.map(order => ({
      ...order,
      pharmacies: {
        pharmacy_name: pharmaciesData?.find(p => p.id === order.pharmacy_id)?.pharmacy_name || 'Unknown Pharmacy',
        phone: pharmaciesData?.find(p => p.id === order.pharmacy_id)?.phone || ''
      }
    }));

    setOrders(ordersWithPharmacies as any);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'out_for_delivery': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'confirmed': return 40;
      case 'preparing': return 60;
      case 'out_for_delivery': return 80;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs px-3 py-2 w-full sm:w-auto">
          <Package className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">My Orders</span>
          <span className="sm:hidden">Orders</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My Medicine Orders</DialogTitle>
          <DialogDescription>
            Track your medicine orders and delivery status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-8">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No medicine orders yet</p>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{order.pharmacies.pharmacy_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Order placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.is_urgent && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          URGENT
                        </Badge>
                      )}
                      <Badge className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Order Progress</span>
                      <span>{getProgressPercentage(order.status)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          order.status === 'cancelled' ? 'bg-red-500' : 
                          order.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${getProgressPercentage(order.status)}%` }}
                      />
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Medicines Ordered:</h5>
                      <p className="text-sm bg-gray-50 p-3 rounded">{order.medicines}</p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Delivery Details:</h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Address:</strong> {order.delivery_address}</p>
                        <p><strong>Phone:</strong> {order.phone}</p>
                        <p><strong>Payment:</strong> {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        {order.pharmacies.phone && (
                          <p><strong>Pharmacy Contact:</strong> {order.pharmacies.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Notes:</h5>
                      <p className="text-sm bg-blue-50 p-3 rounded">{order.notes}</p>
                    </div>
                  )}

                  {/* Status Timeline */}
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium mb-3">Order Timeline:</h5>
                    <div className="flex items-center justify-between text-xs">
                      <div className={`flex flex-col items-center ${
                        ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.status) ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <Clock className="w-4 h-4 mb-1" />
                        <span>Placed</span>
                      </div>
                      <div className={`flex flex-col items-center ${
                        ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.status) ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <CheckCircle className="w-4 h-4 mb-1" />
                        <span>Confirmed</span>
                      </div>
                      <div className={`flex flex-col items-center ${
                        ['preparing', 'out_for_delivery', 'delivered'].includes(order.status) ? 'text-purple-600' : 'text-gray-400'
                      }`}>
                        <Package className="w-4 h-4 mb-1" />
                        <span>Preparing</span>
                      </div>
                      <div className={`flex flex-col items-center ${
                        ['out_for_delivery', 'delivered'].includes(order.status) ? 'text-orange-600' : 'text-gray-400'
                      }`}>
                        <Truck className="w-4 h-4 mb-1" />
                        <span>Out for Delivery</span>
                      </div>
                      <div className={`flex flex-col items-center ${
                        order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <CheckCircle className="w-4 h-4 mb-1" />
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};