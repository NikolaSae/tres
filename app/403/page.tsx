// app/403/page.tsx - JEDNOSTAVNIJA verzija bez session checking
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from '@/contexts/theme-context';

export default function Page403() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  
  // Jednostavno idi na home - home će odlučiti gde redirect
  const redirectUrl = '/';
  const progress = ((5 - countdown) / 5) * 100;
  
  useEffect(() => {
    if (countdown === 0) {
      router.push(redirectUrl);
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, router, redirectUrl]);
  
  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: [0, -15, 0], opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          whileHover={{
            x: [0, -5, 5, -5, 5, 0],
            boxShadow: [
              "0 10px 20px rgba(0,0,0,0.1)",
              "0 15px 25px rgba(0,0,0,0.15)",
              "0 10px 20px rgba(0,0,0,0.1)"
            ],
            transition: { duration: 0.4, ease: "easeInOut" },
          }}
        >
          <Card className="border-0 bg-white dark:bg-gray-800 p-12 text-center rounded-2xl cursor-pointer max-w-md">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <h1 className="text-6xl font-bold text-red-500">403</h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Nemate ovlašćenje za pristup ovoj stranici.
              </p>
              
              {/* Countdown with progress bar */}
              <div className="w-full mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  Automatski prelazak za{' '}
                  <span className="font-bold text-primary text-xl">
                    {countdown}
                  </span>{' '}
                  {countdown === 1 ? 'sekundu' : 'sekundi'}...
                </p>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="rounded-xl px-6 py-3"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Nazad
                </Button>
                
                <Button
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
                  onClick={() => router.push('/')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Idi odmah
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </ThemeProvider>
  );
}