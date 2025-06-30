'use client';

import { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/main-layout"
import { getDebtRecords } from "@/services/debt-service"
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
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function RecordsPage() {
  const [data, setData] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DebtRecord | null>(null);

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
        <h2 className="text-3xl font-bold tracking-tight">Catatan Hutang & Piutang</h2>
        <p className="text-muted-foreground">Kelola semua catatan hutang dan piutang Anda di satu tempat.</p>
        <DataTable columns={columns} data={data} onViewDetails={setSelectedRecord} />
      </div>

      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detail Transaksi</DialogTitle>
              <DialogDescription>
                Detail lengkap untuk transaksi dengan {selectedRecord.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground">Pihak</span>
                <span className="col-span-3 font-semibold">{selectedRecord.name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground">Jumlah</span>
                <span className="col-span-3 font-semibold">{formatCurrency(selectedRecord.amount)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground">Jenis</span>
                <div className="col-span-3">
                    <Badge variant={selectedRecord.type === 'hutang' ? 'destructive' : 'default'}>
                        {selectedRecord.type}
                    </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground">Status</span>
                 <div className="col-span-3">
                    <Badge variant={selectedRecord.status === 'lunas' ? 'secondary' : 'outline'}>
                        {selectedRecord.status}
                    </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground">Tanggal</span>
                <span className="col-span-3">{format(new Date(selectedRecord.date), 'd MMMM yyyy', { locale: localeId })}</span>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground">Jatuh Tempo</span>
                <span className="col-span-3">{format(new Date(selectedRecord.dueDate), 'd MMMM yyyy', { locale: localeId })}</span>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <span className="text-right col-span-1 text-sm font-medium text-muted-foreground pt-1">Deskripsi</span>
                <p className="col-span-3 text-sm">{selectedRecord.description}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  )
}
