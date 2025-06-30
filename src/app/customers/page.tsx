'use client';

import { useState, useEffect } from 'react';
import MainLayout from "@/components/layout/main-layout";
import { getDebtRecords } from "@/services/debt-service";
import type { DebtRecord } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

interface CustomerSummary {
  name: string;
  totalPiutang: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const calculateRemaining = (record: DebtRecord) => {
  if (record.status === 'lunas') return 0;
  const totalPaid = record.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = record.amount - totalPaid;
  return remaining > 0 ? remaining : 0;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const records = await getDebtRecords();
        
        const customerData: { [key: string]: CustomerSummary } = {};

        records.forEach(record => {
          const remainingAmount = calculateRemaining(record);

          if (remainingAmount <= 0) return;
          
          if (!customerData[record.name]) {
            customerData[record.name] = { name: record.name, totalPiutang: 0 };
          }
          
          if (record.type === 'piutang') {
            customerData[record.name].totalPiutang += remainingAmount;
          }
        });
        
        const customerList = Object.values(customerData).filter(c => c.totalPiutang > 0).sort((a,b) => a.name.localeCompare(b.name));
        setCustomers(customerList);

      } catch (error) {
        console.error("Failed to fetch records for customers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
            <Card className="mt-6">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                   <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-3/5" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-4/5" /></TableCell>
                                   </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Daftar Pelanggan</h2>
                <p className="text-muted-foreground">
                  Ringkasan sisa piutang untuk setiap pelanggan.
                </p>
              </div>
              <Button asChild>
                  <Link href="/add">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tambah Catatan
                  </Link>
              </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Pelanggan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Pelanggan</TableHead>
                                    <TableHead className="text-right">Jumlah Piutang</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.length > 0 ? (
                                    customers.map((customer) => (
                                        <TableRow key={customer.name}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell className="text-right text-primary font-mono">{formatCurrency(customer.totalPiutang)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">Tidak ada data pelanggan dengan sisa tagihan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </MainLayout>
  )
}
