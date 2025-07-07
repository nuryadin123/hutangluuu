'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import MainLayout from '@/components/layout/main-layout';
import { format, isPast, subMonths, addMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getDebtRecords } from '@/services/debt-service';
import type { DebtRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const chartConfig = {
  piutang: {
    label: 'Piutang',
    color: 'hsl(var(--chart-1))',
  },
  hutang: {
    label: 'Hutang',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const [data, setData] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        async function fetchData() {
          setLoading(true);
          try {
            const records = await getDebtRecords();
            setData(records);
          } catch (error) {
            console.error("Failed to fetch records:", error);
            setData([]);
          } finally {
            setLoading(false);
          }
        }
        fetchData();
      } else {
        setData([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const monthlyCashflowData = useMemo(() => {
    if (data.length === 0) return [];
    
    const today = new Date();
    const sixMonthsAgo = subMonths(new Date(today.getFullYear(), today.getMonth(), 1), 5);

    const monthlyTotals: { [key: string]: { hutang: number; piutang: number } } = {};
    const monthLabels: { [key: string]: string } = {};

    for (let i = 0; i < 6; i++) {
        const monthDate = addMonths(sixMonthsAgo, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthName = format(monthDate, 'MMM', { locale: localeId });
        monthlyTotals[monthKey] = { hutang: 0, piutang: 0 };
        monthLabels[monthKey] = monthName;
    }

    data.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= sixMonthsAgo) {
            const monthKey = format(recordDate, 'yyyy-MM');
            if (monthlyTotals[monthKey]) {
                if (record.type === 'hutang') {
                    monthlyTotals[monthKey].hutang += record.amount;
                } else {
                    monthlyTotals[monthKey].piutang += record.amount;
                }
            }
        }
    });

    return Object.entries(monthlyTotals).map(([monthKey, totals]) => ({
        month: monthLabels[monthKey],
        ...totals,
    }));
  }, [data]);

  const calculateRemaining = (record: DebtRecord) => {
    if (record.status === 'lunas') return 0;
    const totalPaid = record.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = record.amount - totalPaid;
    return remaining > 0 ? remaining : 0;
  };

  const totalHutang = data
    .filter((d) => d.type === 'hutang' && d.status === 'belum lunas')
    .reduce((acc, curr) => acc + calculateRemaining(curr), 0);
  const totalPiutang = data
    .filter((d) => d.type === 'piutang' && d.status === 'belum lunas')
    .reduce((acc, curr) => acc + calculateRemaining(curr), 0);
    
  const upcomingDues = data
    .filter((d) => {
        if (d.status === 'lunas' || isPast(new Date(d.dueDate))) return false;
        return calculateRemaining(d) > 0;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const recentTransactions = [...data]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-6 animate-pulse">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4"><CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            <Card className="col-span-4 lg:col-span-3"><CardHeader><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center"><Skeleton className="h-10 w-10 rounded-full mr-4" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div><Skeleton className="h-6 w-20 ml-auto" /></div>)}</div></CardContent></Card>
          </div>
          <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Dasbor</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hutang</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalHutang)}</div>
              <p className="text-xs text-muted-foreground">
                Total sisa hutang yang belum lunas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Piutang
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPiutang)}</div>
              <p className="text-xs text-muted-foreground">
                Total sisa piutang yang akan diterima
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Ikhtisar</CardTitle>
              <CardDescription>Aliran kas hutang dan piutang Anda selama 6 bulan terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={monthlyCashflowData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="piutang" fill="var(--color-piutang)" radius={4} />
                  <Bar dataKey="hutang" fill="var(--color-hutang)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>
                5 transaksi terakhir yang Anda catat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center">
                      <div className="p-2 bg-muted rounded-full mr-4">
                        {tx.type === 'hutang' ? (
                          <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {tx.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.description}
                        </p>
                      </div>
                      <div className="ml-auto font-medium text-right">
                        {formatCurrency(tx.amount)}
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'd MMM', { locale: localeId })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                  Belum ada transaksi.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Jatuh Tempo Terdekat</CardTitle>
            <CardDescription>Daftar sisa hutang/piutang yang akan jatuh tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pihak</TableHead>
                  <TableHead className="hidden sm:table-cell">Jenis</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Jatuh Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDues.length > 0 ? (
                  upcomingDues.map((due) => (
                    <TableRow key={due.id}>
                      <TableCell>
                        <div className="font-medium">{due.name}</div>
                        <div className="block sm:hidden mt-1">
                          <Badge variant={due.type === 'hutang' ? 'destructive' : 'default'} className="text-xs">
                            {due.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={due.type === 'hutang' ? 'destructive' : 'default'}>
                          {due.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateRemaining(due))}</TableCell>
                      <TableCell className="text-right">{format(new Date(due.dueDate), 'd MMM yyyy', { locale: localeId })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">Tidak ada data jatuh tempo terdekat.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
