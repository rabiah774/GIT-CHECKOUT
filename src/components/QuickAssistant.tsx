import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Calendar, MapPin, Pill, Building2, ChevronRight, Home, Languages } from "lucide-react";
import { BookAppointment } from "./BookAppointment";
import { OrderMedicine } from "./OrderMedicine";

const translations = {
  en: {
    title: "Kllinic's Smart Bot",
    greeting: "Hi! I'm Kllinic's Smart Bot. How can I help you today?",
    viewAppointments: "View My Appointments",
    findClinics: "Find Clinics",
    findPharmacies: "Find Pharmacies",
    quickActions: "Quick Actions",
    yourAppointments: "Your Appointments",
    availableClinics: "Available Clinics",
    nearbyPharmacies: "Nearby Pharmacies",
    backToMenu: "Back to Menu",
    noAppointments: "No appointments yet",
    noClinics: "No clinics found",
    noPharmacies: "No pharmacies found",
  },
  hi: {
    title: "क्लिनिक का स्मार्ट बॉट",
    greeting: "नमस्ते! मैं क्लिनिक का स्मार्ट बॉट हूं। मैं आपकी कैसे मदद कर सकता हूं?",
    viewAppointments: "मेरी अपॉइंटमेंट देखें",
    findClinics: "क्लिनिक खोजें",
    findPharmacies: "फार्मेसी खोजें",
    quickActions: "त्वरित कार्य",
    yourAppointments: "आपकी अपॉइंटमेंट",
    availableClinics: "उपलब्ध क्लिनिक",
    nearbyPharmacies: "नजदीकी फार्मेसी",
    backToMenu: "मेनू पर वापस जाएं",
    noAppointments: "अभी तक कोई अपॉइंटमेंट नहीं",
    noClinics: "कोई क्लिनिक नहीं मिला",
    noPharmacies: "कोई फार्मेसी नहीं मिली",
  }
};

interface QuickAssistantProps {
  appointments?: any[];
  clinics?: any[];
  pharmacies?: any[];
  onRefresh?: () => void;
}

export const QuickAssistant = ({ 
  appointments = [], 
  clinics = [], 
  pharmacies = [],
  onRefresh 
}: QuickAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'appointments' | 'clinics' | 'pharmacies'>('menu');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const t = translations[language];

  const handleClose = () => {
    setIsOpen(false);
    setCurrentView('menu');
  };

  const handleBack = () => {
    setCurrentView('menu');
  };

  const renderMenu = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        {t.greeting}
      </p>
      
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setCurrentView('appointments')}
      >
        <Calendar className="w-4 h-4 mr-2" />
        {t.viewAppointments}
        <Badge className="ml-auto">{appointments.length}</Badge>
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setCurrentView('clinics')}
      >
        <Building2 className="w-4 h-4 mr-2" />
        {t.findClinics}
        <Badge className="ml-auto">{clinics.length}</Badge>
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setCurrentView('pharmacies')}
      >
        <MapPin className="w-4 h-4 mr-2" />
        {t.findPharmacies}
        <Badge className="ml-auto">{pharmacies.length}</Badge>
      </Button>

      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-2">{t.quickActions}</p>
        <div className="flex gap-2">
          <BookAppointment onSuccess={onRefresh} />
          <OrderMedicine />
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
        ← {t.backToMenu}
      </Button>
      
      <h3 className="font-semibold">{t.yourAppointments}</h3>
      
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t.noAppointments}</p>
          <BookAppointment onSuccess={onRefresh} />
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {appointments.slice(0, 5).map((apt) => (
            <div key={apt.id} className="p-3 border rounded-lg bg-secondary/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{apt.clinics?.clinic_name}</p>
                  {apt.doctors && (
                    <p className="text-xs text-muted-foreground">
                      Dr. {apt.doctors.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <Calendar className="w-3 h-3" />
                    {new Date(apt.appointment_date).toLocaleDateString()}
                    <span>•</span>
                    {apt.appointment_time}
                  </div>
                </div>
                <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                  {apt.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderClinics = () => (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
        ← {t.backToMenu}
      </Button>
      
      <h3 className="font-semibold">{t.availableClinics}</h3>
      
      {clinics.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">{t.noClinics}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {clinics.slice(0, 5).map((clinic) => (
            <div key={clinic.id} className="p-3 border rounded-lg hover:bg-secondary/20 transition-colors">
              <p className="font-medium text-sm">{clinic.clinic_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {clinic.address}
              </p>
              {clinic.phone && (
                <p className="text-xs text-muted-foreground mt-1">
                  📞 {clinic.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      <BookAppointment onSuccess={onRefresh} />
    </div>
  );

  const renderPharmacies = () => (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
        ← {t.backToMenu}
      </Button>
      
      <h3 className="font-semibold">{t.nearbyPharmacies}</h3>
      
      {pharmacies.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">{t.noPharmacies}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pharmacies.slice(0, 5).map((pharmacy) => (
            <div key={pharmacy.id} className="p-3 border rounded-lg hover:bg-secondary/20 transition-colors">
              <p className="font-medium text-sm">{pharmacy.pharmacy_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {pharmacy.address}
              </p>
              {pharmacy.phone && (
                <p className="text-xs text-muted-foreground mt-1">
                  📞 {pharmacy.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      <OrderMedicine />
    </div>
  );

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
          <Card className="shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    className="text-xs"
                  >
                    <Languages className="w-4 h-4 mr-1" />
                    {language === 'en' ? 'हिं' : 'EN'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {currentView === 'menu' && renderMenu()}
              {currentView === 'appointments' && renderAppointments()}
              {currentView === 'clinics' && renderClinics()}
              {currentView === 'pharmacies' && renderPharmacies()}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};