//components/notifications/EmailPreview.tsx

"use client";

import { useState } from "react";
import { X, Maximize, Minimize, Send, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailPreviewProps {
  subject: string;
  htmlContent: string;
  textContent: string;
  recipients: string[];
  onSend?: () => Promise<void>;
  canSend?: boolean;
}

export default function EmailPreview({
  subject,
  htmlContent,
  textContent,
  recipients,
  onSend,
  canSend = false,
}: EmailPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const handleSend = async () => {
    if (!onSend) return;
    
    setIsLoading(true);
    try {
      await onSend();
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const recipientList = recipients.join(", ");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Pregled
        </Button>
      </DialogTrigger>
      <DialogContent className={isFullScreen ? "w-[90vw] h-[90vh] max-w-none" : ""}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Pregled e-mail poruke</DialogTitle>
          <div className="flex items-center gap-2">
            <button onClick={toggleFullScreen} className="p-1 rounded-full hover:bg-gray-100">
              {isFullScreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Tema:</p>
            <p className="text-sm">{subject}</p>
          </div>
          
          <div>
            <p className="text-sm font-semibold">Primaoci:</p>
            <p className="text-sm truncate">{recipientList}</p>
          </div>
          
          <Tabs defaultValue="html" className="w-full">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="mt-2">
              <div className={`border rounded-md p-4 ${isFullScreen ? 'h-[calc(90vh-300px)]' : 'h-[300px]'} overflow-auto bg-white`}>
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </div>
            </TabsContent>
            <TabsContent value="text" className="mt-2">
              <div className={`border rounded-md p-4 ${isFullScreen ? 'h-[calc(90vh-300px)]' : 'h-[300px]'} overflow-auto bg-white font-mono whitespace-pre-wrap text-sm`}>
                {textContent}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          {canSend && onSend && (
            <Button 
              onClick={handleSend} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></span>
                  Slanje...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pošalji
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}