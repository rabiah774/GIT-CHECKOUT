import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Calendar, Activity, Pill, Stethoscope, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HealthMemoryEntry {
  id: string;
  entry_type: string;
  title: string;
  description: string;
  date: string;
  severity?: number;
  health_visits?: {
    clinic_name: string;
    doctor_name: string;
    specialty: string;
    diagnosis: string;
    treatment: string;
  }[];
  health_symptoms?: {
    symptom_name: string;
    body_part: string;
    duration_days: number;
  }[];
  health_medicines?: {
    medicine_name: string;
    dosage: string;
    frequency: string;
    effectiveness: number;
  }[];
}

export const HealthMemory = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HealthMemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");
  
  // Form states
  const [entryType, setEntryType] = useState("symptom");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState("3");
  
  // Symptom specific
  const [symptomName, setSymptomName] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [duration, setDuration] = useState("");
  
  // Medicine specific
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [effectiveness, setEffectiveness] = useState("3");

  useEffect(() => {
    if (open) {
      fetchHealthMemory();
    }
  }, [open]);

  const fetchHealthMemory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('health_memory')
      .select(`
        id,
        entry_type,
        title,
        description,
        date,
        severity,
        health_visits (
          clinic_name,
          doctor_name,
          specialty,
          diagnosis,
          treatment
        ),
        health_symptoms (
          symptom_name,
          body_part,
          duration_days
        ),
        health_medicines (
          medicine_name,
          dosage,
          frequency,
          effectiveness
        )
      `)
      .eq('patient_id', user.id)
      .order('date', { ascending: false });

    if (!error && data) {
      setEntries(data as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create main health memory entry
      const { data: memoryEntry, error: memoryError } = await supabase
        .from('health_memory')
        .insert({
          patient_id: user.id,
          entry_type: entryType,
          title: title,
          description: description,
          date: date,
          severity: entryType === 'symptom' ? parseInt(severity) : null
        })
        .select()
        .single();

      if (memoryError) throw memoryError;

      // Create specific entry based on type
      if (entryType === 'symptom') {
        await supabase
          .from('health_symptoms')
          .insert({
            health_memory_id: memoryEntry.id,
            symptom_name: symptomName,
            body_part: bodyPart,
            duration_days: duration ? parseInt(duration) : null
          });
      } else if (entryType === 'medicine') {
        await supabase
          .from('health_medicines')
          .insert({
            health_memory_id: memoryEntry.id,
            medicine_name: medicineName,
            dosage: dosage,
            frequency: frequency,
            effectiveness: parseInt(effectiveness)
          });
      }

      toast.success("Health memory entry added!");
      setOpen(false);
      resetForm();
      fetchHealthMemory();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(new Date().toISOString().split('T')[0]);
    setSeverity("3");
    setSymptomName("");
    setBodyPart("");
    setDuration("");
    setMedicineName("");
    setDosage("");
    setFrequency("");
    setEffectiveness("3");
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'doctor_visit': return <Stethoscope className="w-5 h-5" />;
      case 'symptom': return <Activity className="w-5 h-5" />;
      case 'medicine': return <Pill className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity?: number) => {
    if (!severity) return 'bg-gray-500';
    if (severity <= 2) return 'bg-green-500';
    if (severity <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Prepare chart data
  const chartData = entries
    .filter(e => e.entry_type === 'symptom' && e.severity)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString(),
      severity: e.severity,
      symptom: e.health_symptoms?.[0]?.symptom_name || e.title
    }))
    .reverse();

  const medicineData = entries
    .filter(e => e.entry_type === 'medicine')
    .map(e => ({
      medicine: e.health_medicines?.[0]?.medicine_name || e.title,
      effectiveness: e.health_medicines?.[0]?.effectiveness || 0
    }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Health Memory
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Health Memory Timeline</DialogTitle>
          <DialogDescription>
            Track your health journey with symptoms, medicines, and doctor visits
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="graphs">Graphs</TabsTrigger>
            <TabsTrigger value="add">Add Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="max-h-[500px] overflow-y-auto space-y-4">
              {entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No health entries yet</p>
              ) : (
                entries.map((entry) => (
                  <Card key={entry.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          entry.entry_type === 'doctor_visit' ? 'bg-blue-100 text-blue-600' :
                          entry.entry_type === 'symptom' ? 'bg-red-100 text-red-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {getEntryIcon(entry.entry_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{entry.title}</h4>
                            <Badge variant="outline">
                              {entry.entry_type.replace('_', ' ')}
                            </Badge>
                            {entry.severity && (
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(entry.severity)}`} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                          {entry.description && (
                            <p className="text-sm mb-2">{entry.description}</p>
                          )}
                          
                          {/* Doctor Visit Details */}
                          {entry.health_visits?.map((visit, idx) => (
                            <div key={idx} className="bg-blue-50 p-3 rounded-lg mt-2">
                              <p className="text-sm"><strong>Clinic:</strong> {visit.clinic_name}</p>
                              {visit.doctor_name && (
                                <p className="text-sm"><strong>Doctor:</strong> {visit.doctor_name}</p>
                              )}
                              {visit.specialty && (
                                <p className="text-sm"><strong>Specialty:</strong> {visit.specialty}</p>
                              )}
                              {visit.diagnosis && (
                                <p className="text-sm"><strong>Diagnosis:</strong> {visit.diagnosis}</p>
                              )}
                            </div>
                          ))}

                          {/* Symptom Details */}
                          {entry.health_symptoms?.map((symptom, idx) => (
                            <div key={idx} className="bg-red-50 p-3 rounded-lg mt-2">
                              <p className="text-sm"><strong>Symptom:</strong> {symptom.symptom_name}</p>
                              {symptom.body_part && (
                                <p className="text-sm"><strong>Body Part:</strong> {symptom.body_part}</p>
                              )}
                              {symptom.duration_days && (
                                <p className="text-sm"><strong>Duration:</strong> {symptom.duration_days} days</p>
                              )}
                            </div>
                          ))}

                          {/* Medicine Details */}
                          {entry.health_medicines?.map((medicine, idx) => (
                            <div key={idx} className="bg-green-50 p-3 rounded-lg mt-2">
                              <p className="text-sm"><strong>Medicine:</strong> {medicine.medicine_name}</p>
                              {medicine.dosage && (
                                <p className="text-sm"><strong>Dosage:</strong> {medicine.dosage}</p>
                              )}
                              {medicine.frequency && (
                                <p className="text-sm"><strong>Frequency:</strong> {medicine.frequency}</p>
                              )}
                              {medicine.effectiveness && (
                                <p className="text-sm"><strong>Effectiveness:</strong> {medicine.effectiveness}/5</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="graphs" className="space-y-6">
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Symptom Severity Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="severity" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {medicineData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Medicine Effectiveness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={medicineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="medicine" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Bar dataKey="effectiveness" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {chartData.length === 0 && medicineData.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Add some symptoms and medicines to see graphs
              </p>
            )}
          </TabsContent>

          <TabsContent value="add">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Entry Type</Label>
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="symptom">Symptom</SelectItem>
                    <SelectItem value="medicine">Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              {entryType === 'symptom' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Symptom Name</Label>
                      <Input
                        value={symptomName}
                        onChange={(e) => setSymptomName(e.target.value)}
                        placeholder="e.g., Headache, Fever"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Body Part</Label>
                      <Input
                        value={bodyPart}
                        onChange={(e) => setBodyPart(e.target.value)}
                        placeholder="e.g., Head, Stomach"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (days)</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="How many days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Severity (1-5)</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Mild</SelectItem>
                          <SelectItem value="2">2 - Light</SelectItem>
                          <SelectItem value="3">3 - Moderate</SelectItem>
                          <SelectItem value="4">4 - Severe</SelectItem>
                          <SelectItem value="5">5 - Very Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {entryType === 'medicine' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Medicine Name</Label>
                      <Input
                        value={medicineName}
                        onChange={(e) => setMedicineName(e.target.value)}
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <Input
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g., 500mg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        placeholder="e.g., Twice daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Effectiveness (1-5)</Label>
                      <Select value={effectiveness} onValueChange={setEffectiveness}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Not Effective</SelectItem>
                          <SelectItem value="2">2 - Slightly Effective</SelectItem>
                          <SelectItem value="3">3 - Moderately Effective</SelectItem>
                          <SelectItem value="4">4 - Very Effective</SelectItem>
                          <SelectItem value="5">5 - Extremely Effective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Entry"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};