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
import { useMemo, useState, useEffect } from 'react';
import { getDebtRecords } from '@/services/debt-service';
import type { DebtRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const barChartData = [
  { month: 'Jan', hutang: 1860, piutang: 800 },
  { month: 'Feb', hutang: 3050, piutang: 2000 },
  { month: 'Mar', hutang: 2370, piutang: 1200 },
  { month: 'Apr', hutang: 730, piutang: 1900 },
  { month: 'Mei', hutang: 2090, piutang: 1300 },
  { month: 'Jun', hutang: 2140, piutang: 1400 },
];

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

const pieChartConfig = {
  hutang: { label: 'Hutang', color: 'hsl(var(--chart-2))' },
  piutang: { label: 'Piutang', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;


export default function ReportsPage() {
  const [data, setData] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const records = await getDebtRecords();
        setData(records);
      } catch (error) {
        console.error("Failed to fetch records:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const pieChartData = useMemo(() => {
    const totalHutang = data.filter((d) => d.type === 'hutang' && d.status === 'belum lunas').reduce((acc, curr) => acc + curr.amount, 0);
    const totalPiutang = data.filter((d) => d.type === 'piutang' && d.status === 'belum lunas').reduce((acc, curr) => acc + curr.amount, 0);

    return [
        { name: 'Hutang', value: totalHutang, fill: 'var(--color-hutang)' },
        { name: 'Piutang', value: totalPiutang, fill: 'var(--color-piutang)' },
    ];
  }, [data]);

  const topParties = useMemo(() => {
    const partyTotals: { [key: string]: { name: string, amount: number, type: 'hutang' | 'piutang' } } = {};
    data.forEach(item => {
      if (!partyTotals[item.name]) {
        partyTotals[item.name] = { name: item.name, amount: 0, type: item.type };
      }
      partyTotals[item.name].amount += item.amount;
    });
    return Object.values(partyTotals).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [data]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-pulse">
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Laporan & Analisis</h2>
        <p className="text-muted-foreground">
          Dapatkan wawasan tentang kesehatan keuangan Anda melalui visualisasi data.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Komposisi Hutang/Piutang</CardTitle>
              <CardDescription>Perbandingan total hutang dan piutang yang belum lunas.</CardDescription>
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
              <CardDescription>Analisis hutang dan piutang berdasarkan pihak terkait.</CardDescription>
            </CardHeader>
            <CardContent>
              {topParties.length > 0 ? (
                <div className="space-y-4">
                  {topParties.map((item) => (
                    <div key={item.name} className="flex items-center">
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
              Visualisasi hutang dan piutang Anda selama 6 bulan terakhir. (Data dummy)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={barChartData}>
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
