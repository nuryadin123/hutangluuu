
'use client';
import MainLayout from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { getDebtRecords } from '@/services/debt-service';
import type { DebtRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { subMonths, addMonths, format, isAfter } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const barChartConfig = {
  piutang: {
    label: 'Piutang',
    color: 'hsl(var(--chart-1))',
  },
  hutang: {
    label: 'Hutang',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;


export default function ReportsPage() {
  const [data, setData] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const calculateRemaining = useCallback((record: DebtRecord) => {
    if (record.status === 'lunas') return 0;
    const totalPaid = record.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = record.amount - totalPaid;
    return remaining > 0 ? remaining : 0;
  }, []);

  const { pieChartData, pieChartConfig } = useMemo(() => {
    const partyTotals: { [name: string]: number } = {};
    data.forEach(record => {
      const remaining = calculateRemaining(record);
      if (remaining > 0) {
        partyTotals[record.name] = (partyTotals[record.name] || 0) + remaining;
      }
    });

    const chartColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];

    const sortedParties = Object.entries(partyTotals).sort((a, b) => b[1] - a[1]);
    
    const dynamicPieChartConfig: ChartConfig = {};
    const dynamicPieChartData = sortedParties.map(([name, value], index) => {
      const key = `party${index}`;
      dynamicPieChartConfig[key] = {
        label: name,
        color: chartColors[index % chartColors.length],
      };
      return {
        name: key,
        value,
        fill: `var(--color-${key})`,
      };
    });

    return { pieChartData: dynamicPieChartData, pieChartConfig: dynamicPieChartConfig };
  }, [data, calculateRemaining]);

  const topParties = useMemo(() => {
    const partyTotals: { [key: string]: { name: string, totalHutang: number, totalPiutang: number } } = {};
    
    data.forEach(item => {
        const remaining = calculateRemaining(item);
        if (remaining <= 0) return;

        if (!partyTotals[item.name]) {
            partyTotals[item.name] = { name: item.name, totalHutang: 0, totalPiutang: 0 };
        }

        if (item.type === 'hutang') {
            partyTotals[item.name].totalHutang += remaining;
        } else {
            partyTotals[item.name].totalPiutang += remaining;
        }
    });

    const flatList = Object.values(partyTotals).flatMap(party => {
        const entries = [];
        if (party.totalHutang > 0) {
            entries.push({ name: party.name, amount: party.totalHutang, type: 'hutang' as const });
        }
        if (party.totalPiutang > 0) {
            entries.push({ name: party.name, amount: party.totalPiutang, type: 'piutang' as const });
        }
        return entries;
    });

    return flatList.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [data, calculateRemaining]);
  
  const monthlyCashflowData = useMemo(() => {
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
        if (isAfter(recordDate, subMonths(sixMonthsAgo, 1))) {
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
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    doc.text("Laporan & Analisis", 14, 15);

    // Table 1: Aliran Kas per Pihak
    if (topParties.length > 0) {
      doc.text("Aliran Kas per Pihak (5 Teratas)", 14, 25);
      doc.autoTable({
          head: [['Pihak', 'Jenis', 'Sisa Tagihan']],
          body: topParties.map(item => [
              item.name,
              item.type,
              formatCurrency(item.amount)
          ]),
          startY: 30,
      });
    }

    // Table 2: Aliran Kas Bulanan
    if (monthlyCashflowData.length > 0) {
      doc.addPage();
      doc.text("Aliran Kas Bulanan (6 Bulan Terakhir)", 14, 15);
      doc.autoTable({
          head: [['Bulan', 'Total Hutang Tercatat', 'Total Piutang Tercatat']],
          body: monthlyCashflowData.map(item => [
              item.month,
              formatCurrency(item.hutang),
              formatCurrency(item.piutang)
          ]),
          startY: 20,
      });
    }

    doc.save("laporan_analisis.pdf");
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 space-y-4 p-4 pt-6 sm:p-6 md:p-8 animate-pulse">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent className="flex justify-center items-center"><Skeleton className="mx-auto aspect-square h-[250px] rounded-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="flex items-center"><div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div><Skeleton className="h-6 w-20" /></div>)}</div></CardContent></Card>
          </div>
          <Card className="mt-4"><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 sm:p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Laporan & Analisis</h2>
            <p className="text-muted-foreground">
              Dapatkan wawasan tentang kesehatan keuangan Anda melalui visualisasi data.
            </p>
          </div>
           <Button onClick={handleExportPDF} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Komposisi Hutang/Piutang</CardTitle>
              <CardDescription>Rincian sisa hutang dan piutang berdasarkan pihak.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={pieChartConfig}
                className="mx-auto aspect-square h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Aliran Kas per Pihak</CardTitle>
              <CardDescription>5 pihak teratas dengan sisa hutang atau piutang terbesar.</CardDescription>
            </CardHeader>
            <CardContent>
              {topParties.length > 0 ? (
                <div className="space-y-4">
                  {topParties.map((item) => (
                    <div key={`${item.name}-${item.type}`} className="flex items-center">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{item.name}</p>
                        <p className="text-sm capitalize" style={{ color: item.type === 'hutang' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}}>{item.type}</p>
                      </div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                  Belum ada data.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Aliran Kas Bulanan</CardTitle>
            <CardDescription>
              Visualisasi hutang dan piutang Anda selama 6 bulan terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyCashflowData}>
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
                <Bar
                  dataKey="piutang"
                  fill="var(--color-piutang)"
                  radius={4}
                />
                <Bar dataKey="hutang" fill="var(--color-hutang)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
