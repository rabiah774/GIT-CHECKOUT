import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface MedicineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface BillGeneratorProps {
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
}

export const BillGenerator = ({ pharmacyName = "", pharmacyAddress = "", pharmacyPhone = "" }: BillGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Pharmacy details
  const [billPharmacyName, setBillPharmacyName] = useState(pharmacyName);
  const [billPharmacyAddress, setBillPharmacyAddress] = useState(pharmacyAddress);
  const [billPharmacyPhone, setBillPharmacyPhone] = useState(pharmacyPhone);
  const [licenseNumber, setLicenseNumber] = useState("");
  
  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  // Bill details
  const [billNumber, setBillNumber] = useState(`BILL-${Date.now()}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Medicine items
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { id: '1', name: '', quantity: 1, price: 0, total: 0 }
  ]);

  const addMedicine = () => {
    const newId = (medicines.length + 1).toString();
    setMedicines([...medicines, { id: newId, name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeMedicine = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter(med => med.id !== id));
    }
  };

  const updateMedicine = (id: string, field: keyof MedicineItem, value: string | number) => {
    setMedicines(medicines.map(med => {
      if (med.id === id) {
        const updated = { ...med, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return med;
    }));
  };

  const calculateSubtotal = () => {
    return medicines.reduce((sum, med) => sum + med.total, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const generatePDF = () => {
    if (!billPharmacyName || !customerName || medicines.some(med => !med.name || med.quantity <= 0 || med.price <= 0)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PHARMACY BILL', pageWidth / 2, 20, { align: 'center' });
      
      // Pharmacy Details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(billPharmacyName, 20, 40);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (billPharmacyAddress) {
        const addressLines = doc.splitTextToSize(billPharmacyAddress, 100);
        doc.text(addressLines, 20, 48);
      }
      if (billPharmacyPhone) doc.text(`Phone: ${billPharmacyPhone}`, 20, 64);
      if (licenseNumber) doc.text(`License No: ${licenseNumber}`, 20, 72);
      
      // Bill Details (Right side)
      doc.setFont('helvetica', 'bold');
      doc.text(`Bill No: ${billNumber}`, pageWidth - 20, 40, { align: 'right' });
      doc.text(`Date: ${new Date(billDate).toLocaleDateString()}`, pageWidth - 20, 48, { align: 'right' });
      
      // Customer Details
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO:', 20, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(customerName, 20, 98);
      if (customerPhone) doc.text(`Phone: ${customerPhone}`, 20, 106);
      if (customerAddress) {
        const customerAddressLines = doc.splitTextToSize(customerAddress, 100);
        doc.text(customerAddressLines, 20, 114);
      }
      
      // Medicine Table Header
      let yPosition = 140;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      
      // Draw table header
      doc.rect(20, yPosition - 8, pageWidth - 40, 12);
      doc.setFillColor(41, 128, 185);
      doc.rect(20, yPosition - 8, pageWidth - 40, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.text('Medicine Name', 25, yPosition - 2);
      doc.text('Qty', 120, yPosition - 2);
      doc.text('Price', 140, yPosition - 2);
      doc.text('Total', 165, yPosition - 2);
      
      // Medicine Items
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPosition += 8;
      
      const validMedicines = medicines.filter(med => med.name && med.quantity > 0 && med.price > 0);
      
      validMedicines.forEach((med, index) => {
        doc.text(med.name, 25, yPosition);
        doc.text(med.quantity.toString(), 120, yPosition);
        doc.text(`₹${med.price.toFixed(2)}`, 140, yPosition);
        doc.text(`₹${med.total.toFixed(2)}`, 165, yPosition);
        
        // Draw row separator
        if (index < validMedicines.length - 1) {
          doc.line(20, yPosition + 3, pageWidth - 20, yPosition + 3);
        }
        
        yPosition += 10;
      });
      
      // Draw table border
      doc.rect(20, 132, pageWidth - 40, yPosition - 132);
      
      // Calculate totals
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const total = calculateTotal();
      
      // Totals section
      yPosition += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', pageWidth - 80, yPosition);
      doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 8;
      doc.text('GST (18%):', pageWidth - 80, yPosition);
      doc.text(`₹${tax.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total Amount:', pageWidth - 80, yPosition);
      doc.text(`₹${total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      
      // Footer
      yPosition += 25;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
      doc.text('This is a computer generated bill.', pageWidth / 2, yPosition + 8, { align: 'center' });
      
      // Download PDF
      const fileName = `Bill_${billNumber}_${customerName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
      toast.success("Bill generated successfully!");
      setOpen(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setBillNumber(`BILL-${Date.now()}`);
    setBillDate(new Date().toISOString().split('T')[0]);
    setMedicines([{ id: '1', name: '', quantity: 1, price: 0, total: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generate Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Pharmacy Bill</DialogTitle>
          <DialogDescription>
            Create a professional bill for medicine sales
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pharmacy Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pharmacy Name *</Label>
                <Input
                  value={billPharmacyName}
                  onChange={(e) => setBillPharmacyName(e.target.value)}
                  placeholder="Enter pharmacy name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={billPharmacyAddress}
                  onChange={(e) => setBillPharmacyAddress(e.target.value)}
                  placeholder="Enter pharmacy address"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={billPharmacyPhone}
                  onChange={(e) => setBillPharmacyPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Enter license number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter customer phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter customer address"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bill Number</Label>
                  <Input
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    placeholder="Bill number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medicine Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Medicine Items
              <Button size="sm" onClick={addMedicine}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medicines.map((medicine, index) => (
                <div key={medicine.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <Label>Medicine Name *</Label>
                    <Input
                      value={medicine.name}
                      onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                      placeholder="Enter medicine name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={medicine.quantity}
                      onChange={(e) => updateMedicine(medicine.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Price (₹) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={medicine.price}
                      onChange={(e) => updateMedicine(medicine.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Total (₹)</Label>
                    <Input
                      value={`₹${medicine.total.toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeMedicine(medicine.id)}
                      disabled={medicines.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{calculateTax(calculateSubtotal()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={resetForm}>
            Reset Form
          </Button>
          <Button onClick={generatePDF} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate & Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};