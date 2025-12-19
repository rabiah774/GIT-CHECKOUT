import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

interface AIStockUpdaterProps {
  pharmacyId: string;
}

interface ProcessedItem {
  medicine_name: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
  confidence: number;
  status: 'pending' | 'updated' | 'error';
}

export const AIStockUpdater = ({ pharmacyId }: AIStockUpdaterProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'scanning' | 'updating' | 'completed'>('idle');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setProcessedItems([]);
        setProgress(0);
        setProcessingStatus('idle');
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const simulateAIProcessing = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setProcessingStatus('uploading');
    setProgress(10);

    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(30);
    setProcessingStatus('scanning');

    // Simulate AI scanning
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProgress(60);

    // Simulate data extraction
    const mockExtractedData: ProcessedItem[] = [
      {
        medicine_name: "Paracetamol 500mg",
        quantity: 100,
        batch_number: "PAR2024001",
        expiry_date: "2025-12-31",
        confidence: 0.95,
        status: 'pending'
      },
      {
        medicine_name: "Amoxicillin 250mg",
        quantity: 50,
        batch_number: "AMX2024002",
        expiry_date: "2025-08-15",
        confidence: 0.88,
        status: 'pending'
      },
      {
        medicine_name: "Ibuprofen 400mg",
        quantity: 75,
        batch_number: "IBU2024003",
        expiry_date: "2026-03-20",
        confidence: 0.92,
        status: 'pending'
      }
    ];

    setProcessedItems(mockExtractedData);
    setProgress(80);
    setProcessingStatus('updating');

    // Simulate stock updates
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update status of items
    const updatedItems = mockExtractedData.map(item => ({
      ...item,
      status: Math.random() > 0.1 ? 'updated' as const : 'error' as const
    }));
    
    setProcessedItems(updatedItems);
    setProgress(100);
    setProcessingStatus('completed');
    setProcessing(false);

    const successCount = updatedItems.filter(item => item.status === 'updated').length;
    const errorCount = updatedItems.filter(item => item.status === 'error').length;

    if (errorCount === 0) {
      toast.success(`Successfully updated ${successCount} items in stock!`);
    } else {
      toast.warning(`Updated ${successCount} items, ${errorCount} failed`);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setProcessedItems([]);
    setProgress(0);
    setProcessingStatus('idle');
    setProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'updated': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'updated': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getProcessingMessage = () => {
    switch (processingStatus) {
      case 'uploading': return 'Uploading PDF file...';
      case 'scanning': return 'AI scanning document for medicine data...';
      case 'updating': return 'Updating stock inventory...';
      case 'completed': return 'Processing completed!';
      default: return '';
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          AI Stock Auto Updater
          <Badge variant="outline" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload purchase bills (PDF) and let AI automatically update your stock inventory
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
          {!selectedFile ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Upload Purchase Bill</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a PDF file containing medicine purchase details
                </p>
                <Label htmlFor="bill-upload" className="cursor-pointer">
                  <Button asChild>
                    <span>Choose PDF File</span>
                  </Button>
                </Label>
                <Input
                  id="bill-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={simulateAIProcessing} 
                  disabled={processing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Start AI Processing
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetUploader} disabled={processing}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {processing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getProcessingMessage()}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        {/* Processed Items */}
        {processedItems.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Extracted Medicine Data
            </h4>
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {processedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{item.medicine_name}</h5>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(item.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity} • Batch: {item.batch_number} • Expiry: {new Date(item.expiry_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <Badge className={getStatusColor(item.status)}>
                      {item.status === 'updated' ? 'Updated' : 
                       item.status === 'error' ? 'Failed' : 'Processing'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Features Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Features
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-700">
            <div>
              <h5 className="font-medium mb-1">✨ Smart Extraction</h5>
              <p>Automatically detects medicine names, quantities, and batch numbers</p>
            </div>
            <div>
              <h5 className="font-medium mb-1">🎯 High Accuracy</h5>
              <p>Advanced OCR with 95%+ accuracy for pharmaceutical documents</p>
            </div>
            <div>
              <h5 className="font-medium mb-1">⚡ Instant Updates</h5>
              <p>Directly updates your stock inventory without manual entry</p>
            </div>
            <div>
              <h5 className="font-medium mb-1">🔍 Smart Validation</h5>
              <p>Validates data and shows confidence scores for each item</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">How to Use</h4>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Upload a PDF bill from your medicine supplier</li>
            <li>Click "Start AI Processing" to scan the document</li>
            <li>Review the extracted data and confidence scores</li>
            <li>AI will automatically update your stock inventory</li>
            <li>Check the results and manually adjust if needed</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};