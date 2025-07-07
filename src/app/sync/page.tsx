'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getDebtRecords, addDebtRecord } from '@/services/debt-service';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, Download, Upload } from 'lucide-react';
import * as z from 'zod';

// Define a schema for validating imported records
const importRecordSchema = z.object({
  id: z.string(), // We'll ignore the old ID and let Firebase generate a new one
  name: z.string(),
  amount: z.number(),
  currency: z.enum(['IDR', 'USD']),
  type: z.enum(['hutang', 'piutang']),
  status: z.enum(['lunas', 'belum lunas']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid due date format" }),
  description: z.string().optional(),
  payments: z.array(z.object({
    amount: z.number(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid payment date format" }),
    notes: z.string().optional(),
  })).optional(),
});

const importFileSchema = z.array(importRecordSchema);


export default function SyncPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleExport = async () => {
    if (!isLoggedIn) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Anda harus login untuk mengekspor data.' });
      return;
    }
    setIsExporting(true);
    try {
      const records = await getDebtRecords();
      const jsonData = JSON.stringify(records, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `catatan-hutang-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Berhasil', description: 'Data Anda telah diekspor.' });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengekspor data.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!isLoggedIn) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Anda harus login untuk mengimpor data.' });
      return;
    }
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Silakan pilih file untuk diimpor.' });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read");
        }
        const data = JSON.parse(text);

        // Validate the structure of the JSON file
        const validationResult = importFileSchema.safeParse(data);
        if (!validationResult.success) {
            console.error("Validation errors:", validationResult.error.flatten());
            throw new Error("Format file tidak valid atau data rusak.");
        }
        
        const recordsToImport = validationResult.data;
        let successCount = 0;
        
        await Promise.all(recordsToImport.map(async (record) => {
            const { id, ...recordData } = record; // Exclude old ID
            await addDebtRecord({
                ...recordData,
                description: recordData.description || '', // Ensure description is a string
                date: new Date(record.date),
                dueDate: new Date(record.dueDate),
            });
            successCount++;
        }));

        toast({ title: 'Berhasil', description: `${successCount} dari ${recordsToImport.length} catatan berhasil diimpor.` });
        setSelectedFile(null); // Clear file input
        const fileInput = document.getElementById('json-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } catch (error: any) {
        console.error('Import failed:', error);
        toast({ variant: 'destructive', title: 'Import Gagal', description: error.message || 'Terjadi kesalahan saat mengimpor file.' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal membaca file.' });
      setIsImporting(false);
    };
    reader.readAsText(selectedFile);
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 sm:p-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">Backup & Sinkronisasi</h2>
        <p className="text-muted-foreground">
          Data Anda disinkronkan secara otomatis ke cloud. Gunakan fitur ini untuk membuat backup manual (ekspor) atau memulihkan data dari file backup (impor).
        </p>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Ekspor Data (Backup)</CardTitle>
                    <CardDescription>
                        Unduh semua data catatan hutang dan piutang Anda ke dalam sebuah file JSON sebagai cadangan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport} disabled={isExporting || !isLoggedIn}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Mengekspor...' : 'Ekspor Semua Data'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Impor Data (Restore)</CardTitle>
                    <CardDescription>
                        Impor data dari file backup JSON. Fitur ini akan menambahkan catatan baru dan tidak akan menimpa atau menghapus data yang sudah ada.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Input id="json-file" type="file" accept=".json" onChange={handleFileChange} disabled={!isLoggedIn} />
                    </div>
                    <Button onClick={handleImport} disabled={isImporting || !selectedFile || !isLoggedIn}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isImporting ? 'Mengimpor...' : 'Impor Data'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
