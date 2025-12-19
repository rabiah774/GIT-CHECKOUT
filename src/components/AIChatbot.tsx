import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X } from "lucide-react";

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-16 h-16 bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="lg"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] shadow-2xl rounded-lg overflow-hidden">
          <Card className="h-full">
            <CardHeader className="bg-blue-600 text-white p-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <div>
                  <div className="text-sm font-medium">Talk with AI Bot</div>
                  <div className="text-xs opacity-90">AI बॉट से बात करें</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <iframe
                src="https://cdn.botpress.cloud/webchat/v3.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/11/08/12/20251108122345-SL8R450K.json"
                className="w-full h-full border-0"
                title="AI Healthcare Chatbot"
                allow="microphone; camera"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};