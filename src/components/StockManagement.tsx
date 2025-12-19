import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AIForecastDashboard from "./ai/AIForecastDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Edit, Trash2, AlertTriangle, Calendar, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockItem {
  id: string;
  medicine_name: string;
  generic_name: string;
  manufacturer: string;
  batch_number: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  purchase_date: string;
  expiry_date: string;
  supplier_name: string;
  supplier_contact: string;
  storage_location: string;
  minimum_stock_level: number;
  notes: string;
}

interface StockManagementProps {
  pharmacyId: string;
}

export const StockManagement = ({ pharmacyId }: StockManagementProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Form states
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({
    medicine_name: "",
    generic_name: "",
    manufacturer: "",
    batch_number: "",
    quantity: 0,
    unit: "pieces",
    purchase_price: 0,
    selling_price: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    supplier_name: "",
    supplier_contact: "",
    storage_location: "",
    minimum_stock_level: 10,
    notes: ""
  });

  useEffect(() => {
    if (open && pharmacyId) {
      fetchStock();
    }
  }, [open, pharmacyId]);

  const fetchStock = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pharmacy_stock')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('medicine_name');

    if (!error && data) {
      setStockItems(data);
    } else if (error) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to load stock data');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('pharmacy_stock')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Stock item updated successfully!');
      } else {
        // Create new item
        const { error } = await supabase
          .from('pharmacy_stock')
          .insert({
            ...formData,
            pharmacy_id: pharmacyId
          });

        if (error) throw error;
        toast.success('Stock item added successfully!');
      }

      resetForm();
      fetchStock();
    } catch (error: any) {
      console.error('Error saving stock item:', error);
      if (error.code === '23505') {
        toast.error('Batch number already exists for this pharmacy');
      } else {
        toast.error('Failed to save stock item');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      medicine_name: item.medicine_name,
      generic_name: item.generic_name || "",
      manufacturer: item.manufacturer || "",
      batch_number: item.batch_number,
      quantity: item.quantity,
      unit: item.unit,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
      purchase_date: item.purchase_date,
      expiry_date: item.expiry_date,
      supplier_name: item.supplier_name || "",
      supplier_contact: item.supplier_contact || "",
      storage_location: item.storage_location || "",
      minimum_stock_level: item.minimum_stock_level,
      notes: item.notes || ""
    });
    setActiveTab("add");
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;

    const { error } = await supabase
      .from('pharmacy_stock')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete stock item');
    } else {
      toast.success('Stock item deleted successfully!');
      fetchStock();
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      medicine_name: "",
      generic_name: "",
      manufacturer: "",
      batch_number: "",
      quantity: 0,
      unit: "pieces",
      purchase_price: 0,
      selling_price: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      supplier_name: "",
      supplier_contact: "",
      storage_location: "",
      minimum_stock_level: 10,
      notes: ""
    });
    setActiveTab("all");
  };

  const getStockStatus = (item: StockItem) => {
    if (item.quantity <= item.minimum_stock_level) return 'low';
    if (item.quantity <= item.minimum_stock_level * 1.5) return 'warning';
    return 'normal';
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    if (daysUntilExpiry <= 90) return 'expiring_later';
    return 'good';
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.batch_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'low') return matchesSearch && getStockStatus(item) === 'low';
    if (activeTab === 'expiring') return matchesSearch && ['expired', 'expiring_soon'].includes(getExpiryStatus(item.expiry_date));
    
    return matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Package className="w-4 h-4 mr-2" />
          Manage Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Management</DialogTitle>
          <DialogDescription>
            Manage your pharmacy inventory, track stock levels and expiry dates
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Stock ({stockItems.length})</TabsTrigger>
            <TabsTrigger value="low">Low Stock ({stockItems.filter(i => getStockStatus(i) === 'low').length})</TabsTrigger>
            <TabsTrigger value="expiring">Expiring ({stockItems.filter(i => ['expired', 'expiring_soon'].includes(getExpiryStatus(i.expiry_date))).length})</TabsTrigger>
            <TabsTrigger value="ai">AI Forecast</TabsTrigger>
            <TabsTrigger value="add">{editingItem ? 'Edit' : 'Add'} Stock</TabsTrigger>
          </TabsList>
          <TabsContent value="ai">
            <div className="space-y-4">
              <AIForecastDashboard />
            </div>
          </TabsContent>


          <TabsContent value="all" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search medicines, generic names, or batch numbers..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setActiveTab("add")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>

            <div className="grid gap-4 max-h-[500px] overflow-y-auto">
              {loading ? (
                <p className="text-center py-8">Loading stock...</p>
              ) : filteredItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No stock items found</p>
              ) : (
                filteredItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{item.medicine_name}</h4>
                            {getStockStatus(item) === 'low' && (
                              <Badge variant="destructive">Low Stock</Badge>
                            )}
                            {getExpiryStatus(item.expiry_date) === 'expired' && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {getExpiryStatus(item.expiry_date) === 'expiring_soon' && (
                              <Badge variant="outline" className="border-orange-500 text-orange-600">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p><strong>Generic:</strong> {item.generic_name || 'N/A'}</p>
                              <p><strong>Manufacturer:</strong> {item.manufacturer || 'N/A'}</p>
                              <p><strong>Batch:</strong> {item.batch_number}</p>
                            </div>
                            <div>
                              <p><strong>Quantity:</strong> {item.quantity} {item.unit}</p>
                              <p><strong>Min Level:</strong> {item.minimum_stock_level}</p>
                              <p><strong>Location:</strong> {item.storage_location || 'N/A'}</p>
                            </div>
                            <div>
                              <p><strong>Purchase:</strong> ₹{item.purchase_price}</p>
                              <p><strong>Selling:</strong> ₹{item.selling_price}</p>
                              <p><strong>Expiry:</strong> {new Date(item.expiry_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="low">
            <div className="grid gap-4 max-h-[500px] overflow-y-auto">
              {stockItems.filter(i => getStockStatus(i) === 'low').map((item) => (
                <Card key={item.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold">{item.medicine_name}</h4>
                      <Badge variant="destructive">Only {item.quantity} left</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minimum required: {item.minimum_stock_level} {item.unit}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="expiring">
            <div className="grid gap-4 max-h-[500px] overflow-y-auto">
              {stockItems.filter(i => ['expired', 'expiring_soon'].includes(getExpiryStatus(i.expiry_date))).map((item) => (
                <Card key={item.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <h4 className="font-semibold">{item.medicine_name}</h4>
                      <Badge variant={getExpiryStatus(item.expiry_date) === 'expired' ? 'destructive' : 'outline'}>
                        {getExpiryStatus(item.expiry_date) === 'expired' ? 'Expired' : 'Expiring Soon'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expiry Date: {new Date(item.expiry_date).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="add">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medicine Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Medicine Name *</Label>
                      <Input
                        value={formData.medicine_name}
                        onChange={(e) => setFormData({...formData, medicine_name: e.target.value})}
                        placeholder="Enter medicine name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Generic Name</Label>
                      <Input
                        value={formData.generic_name}
                        onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
                        placeholder="Enter generic name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Manufacturer</Label>
                      <Input
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                        placeholder="Enter manufacturer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Batch Number *</Label>
                      <Input
                        value={formData.batch_number}
                        onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                        placeholder="Enter batch number"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Stock & Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stock & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="bottles">Bottles</SelectItem>
                            <SelectItem value="strips">Strips</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                            <SelectItem value="ml">ML</SelectItem>
                            <SelectItem value="grams">Grams</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Purchase Price (₹) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.purchase_price}
                          onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Selling Price (₹) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.selling_price}
                          onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Stock Level</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.minimum_stock_level}
                        onChange={(e) => setFormData({...formData, minimum_stock_level: parseInt(e.target.value) || 10})}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dates & Supplier */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dates & Supplier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Purchase Date *</Label>
                        <Input
                          type="date"
                          value={formData.purchase_date}
                          onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date *</Label>
                        <Input
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier Name</Label>
                      <Input
                        value={formData.supplier_name}
                        onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                        placeholder="Enter supplier name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier Contact</Label>
                      <Input
                        value={formData.supplier_contact}
                        onChange={(e) => setFormData({...formData, supplier_contact: e.target.value})}
                        placeholder="Enter supplier contact"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Storage Location</Label>
                      <Input
                        value={formData.storage_location}
                        onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                        placeholder="e.g., Shelf A-1, Section B"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Any additional notes..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {editingItem ? 'Cancel' : 'Reset'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingItem ? 'Update Stock' : 'Add to Stock'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};