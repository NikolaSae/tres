// app/(protected)/403/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function Page403() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
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
        <Card className="border-0 bg-white dark:bg-gray-800 p-12 text-center rounded-2xl cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h1 className="text-6xl font-bold text-red-500">403</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Nemate ovlašćenje za pristup ovoj stranici.
            </p>
            <Button
              className="mt-6 bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8 py-3"
              onClick={() => router.push('/')}
            >
              Vrati se na početnu
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
