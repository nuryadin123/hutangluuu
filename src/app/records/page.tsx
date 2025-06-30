'use client';

import { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/main-layout"
import { getDebtRecords } from "@/services/debt-service"
import type { DebtRecord } from "@/lib/types"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Skeleton } from '@/components/ui/skeleton';

export default function RecordsPage() {
  const [data, setData] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
        <DataTable columns={columns} data={data} />
      </div>
    </MainLayout>
  )
}
