'use client';

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
import { DUMMY_DATA } from '@/lib/data';
import MainLayout from '@/components/layout/main-layout';
import { format, isPast } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const chartData = [
  { month: 'Jan', hutang: 186000, piutang: 80000 },
  { month: 'Feb', hutang: 305000, piutang: 200000 },
  { month: 'Mar', hutang: 237000, piutang: 120000 },
  { month: 'Apr', hutang: 73000, piutang: 190000 },
  { month: 'Mei', hutang: 209000, piutang: 130000 },
  { month: 'Jun', hutang: 214000, piutang: 140000 },
];

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
  const totalHutang = DUMMY_DATA.filter(
    (d) => d.type === 'hutang' && d.status === 'belum lunas'
  ).reduce((acc, curr) => acc + curr.amount, 0);
  const totalPiutang = DUMMY_DATA.filter(
    (d) => d.type === 'piutang' && d.status === 'belum lunas'
  ).reduce((acc, curr) => acc + curr.amount, 0);
  const upcomingDues = DUMMY_DATA.filter(
    (d) => d.status === 'belum lunas' && !isPast(new Date(d.dueDate))
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const recentTransactions = [...DUMMY_DATA].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
                Total hutang yang belum lunas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Piutang
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPiutang)}</div>
              <p className="text-xs text-muted-foreground">
                Total piutang yang akan diterima
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
                <BarChart accessibilityLayer data={chartData}>
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
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center">
                    <div className="p-2 bg-muted rounded-full mr-4">
                      {tx.type === 'hutang' ? (
                        <ArrowDownCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
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
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Jatuh Tempo Terdekat</CardTitle>
            <CardDescription>Daftar hutang/piutang yang akan jatuh tempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pihak</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Jatuh Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDues.length > 0 ? (
                  upcomingDues.map((due) => (
                    <TableRow key={due.id}>
                      <TableCell>{due.name}</TableCell>
                      <TableCell>
                        <Badge variant={due.type === 'hutang' ? 'destructive' : 'default'} className={due.type === 'piutang' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                          {due.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(due.amount)}</TableCell>
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
