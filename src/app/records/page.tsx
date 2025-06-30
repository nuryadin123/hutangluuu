'use client';

import { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/main-layout"
import { getDebtRecords, addPayment } from "@/services/debt-service"
import type { DebtRecord } from "@/lib/types"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Jumlah harus lebih dari 0." }),
  date: z.date({ required_error: "Tanggal pembayaran harus diisi." }),
});

export default function RecordsPage() {
  const [data, setData] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DebtRecord | null>(null);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const { toast } = useToast();

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
    },
  });

  useEffect(() => {
    async function getData() {
      try {
        const records = await getDebtRecords();
        setData(records);
      } catch (error) {
        console.error("Failed to fetch records:", error);
      } finally {
        setLoading(false);
      }
    }
    getData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateRemaining = (record: DebtRecord): number => {
    if (record.status === 'lunas') return 0;
    const totalPaid = record.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = record.amount - totalPaid;
    return remaining > 0 ? remaining : 0;
  };

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Gagal Ekspor',
        description: 'Tidak ada data untuk diekspor.',
      });
      return;
    }

    const doc = new jsPDF();
    const tableColumns = ["Pihak", "Jenis", "Jumlah Awal", "Sisa Tagihan", "Status", "Jatuh Tempo"];
    const tableRows: (string | number)[][] = [];

    data.forEach(record => {
        const remainingAmount = calculateRemaining(record);
        const recordRow = [
            record.name,
            record.type,
            formatCurrency(record.amount),
            formatCurrency(remainingAmount),
            record.status,
            format(new Date(record.dueDate), "d MMM yyyy", { locale: localeId }),
        ];
        tableRows.push(recordRow);
    });

    doc.text("Laporan Hutang & Piutang", 14, 15);
    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 20,
    });
    doc.save("laporan_hutang_piutang.pdf");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRecord(null);
      paymentForm.reset({ date: new Date(), amount: 0 });
    }
  };

  async function handlePaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (!selectedRecord) return;

    const totalPaid = selectedRecord.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remainingAmount = selectedRecord.amount - totalPaid;

    if (values.amount > remainingAmount) {
        paymentForm.setError("amount", {
            type: "manual",
            message: `Pembayaran tidak boleh melebihi sisa ${formatCurrency(remainingAmount)}`,
        });
        return;
    }

    setIsPaymentSubmitting(true);
    try {
      const updatedRecord = await addPayment(selectedRecord.id, values);

      const newData = data.map(r => (r.id === updatedRecord.id ? updatedRecord : r));
      setData(newData);
      setSelectedRecord(updatedRecord);
      
      toast({ title: "Sukses", description: "Pembayaran berhasil dicatat." });
      paymentForm.reset({ date: new Date(), amount: 0 });

      if (updatedRecord.status === 'lunas') {
        setTimeout(() => {
          setSelectedRecord(null);
        }, 1500)
      }

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal mencatat pembayaran." });
    } finally {
      setIsPaymentSubmitting(false);
    }
  }

  const totalPaid = selectedRecord?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingAmount = selectedRecord ? selectedRecord.amount - totalPaid : 0;

  if (loading) {
    return (
       <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-4 mt-6">
             <div className="flex items-center py-4 gap-2">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-28 ml-auto" />
             </div>
             <div className="rounded-md border">
                <Skeleton className="h-[480px] w-full" />
             </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
             </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Catatan Hutang & Piutang</h2>
            <p className="text-muted-foreground">Kelola semua catatan hutang dan piutang Anda di satu tempat.</p>
          </div>
          <Button onClick={handleExportPDF} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
        <DataTable columns={columns} data={data} onViewDetails={setSelectedRecord} />
      </div>

      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detail Transaksi</DialogTitle>
              <DialogDescription>
                Detail lengkap untuk transaksi dengan {selectedRecord.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground">Pihak</span>
                <span className="col-span-2 font-semibold">{selectedRecord.name}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground">Jumlah</span>
                <span className="col-span-2 font-semibold">{formatCurrency(selectedRecord.amount)}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground">Jenis</span>
                <div className="col-span-2">
                    <Badge variant={selectedRecord.type === 'hutang' ? 'destructive' : 'default'}>
                        {selectedRecord.type}
                    </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground">Status</span>
                 <div className="col-span-2">
                    <Badge variant={selectedRecord.status === 'lunas' ? 'secondary' : 'outline'}>
                        {selectedRecord.status}
                    </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground">Tanggal</span>
                <span className="col-span-2">{format(new Date(selectedRecord.date), 'd MMMM yyyy', { locale: localeId })}</span>
              </div>
               <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground">Jatuh Tempo</span>
                <span className="col-span-2">{format(new Date(selectedRecord.dueDate), 'd MMMM yyyy', { locale: localeId })}</span>
              </div>
              <div className="grid grid-cols-3 items-start gap-4">
                <span className="text-left col-span-1 text-sm font-medium text-muted-foreground pt-1">Deskripsi</span>
                <p className="col-span-2 text-sm">{selectedRecord.description}</p>
              </div>

              <Separator className="my-2" />
  
              <h4 className="font-semibold mb-2">Riwayat Pembayaran</h4>
              
              {selectedRecord.payments && selectedRecord.payments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecord.payments.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{format(new Date(p.date), 'd MMM yyyy', { locale: localeId })}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat pembayaran.</p>
              )}
              <div className="mt-2 text-base font-semibold text-right">
                Sisa Tagihan: {formatCurrency(remainingAmount)}
              </div>

              {selectedRecord.status === 'belum lunas' && (
                <>
                  <Separator className="my-2" />
                  <h4 className="font-semibold">Catat Pembayaran Baru</h4>
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
                      <FormField
                        control={paymentForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jumlah Pembayaran</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Tanggal Pembayaran</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP', { locale: localeId })
                                    ) : (
                                      <span>Pilih tanggal</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={isPaymentSubmitting}>
                          {isPaymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Simpan Pembayaran
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  )
}
