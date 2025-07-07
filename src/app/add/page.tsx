'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useRef, type TouchEvent as ReactTouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addDebtRecord } from '@/services/debt-service';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nama pihak harus diisi.' }),
  amount: z.coerce.number().positive({ message: 'Jumlah harus lebih dari 0.' }),
  type: z.enum(['hutang', 'piutang'], {
    required_error: 'Jenis transaksi harus dipilih.',
  }),
  status: z.enum(['lunas', 'belum lunas'], {
    required_error: 'Status harus dipilih.',
  }),
  currency: z.enum(['IDR', 'USD']),
  date: z.date({ required_error: 'Tanggal transaksi harus diisi.' }),
  dueDate: z.date({ required_error: 'Tanggal jatuh tempo harus diisi.' }),
  description: z.string().optional(),
});

export default function AddRecordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: '' as any,
      currency: 'IDR',
      status: 'belum lunas',
      description: '',
      date: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await addDebtRecord(values);
      toast({
        title: 'Berhasil!',
        description: 'Catatan baru telah berhasil ditambahkan.',
      });
      router.push('/records');
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: 'Gagal!',
        description: 'Terjadi kesalahan saat menambahkan catatan.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, button, textarea, [role="button"], [role="option"], [role="gridcell"]')) {
      touchStartX.current = 0;
      return;
    }
    
    touchStartX.current = e.targetTouches[0].clientX;
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (cardRef.current && touchStartX.current !== 0) {
      const currentX = e.targetTouches[0].clientX;
      const diff = currentX - touchStartX.current;
      cardRef.current.style.transform = `translateX(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (cardRef.current && touchStartX.current !== 0) {
      const transformMatrix = window.getComputedStyle(cardRef.current).getPropertyValue('transform');
      const currentTranslateX = transformMatrix !== 'none' ? new DOMMatrix(transformMatrix).m41 : 0;
      const cardWidth = cardRef.current.offsetWidth;
      const threshold = cardWidth / 3;

      cardRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

      if (Math.abs(currentTranslateX) > threshold) {
        cardRef.current.style.transform = `translateX(${Math.sign(currentTranslateX) * cardWidth}px)`;
        cardRef.current.style.opacity = '0';
        setTimeout(() => {
          router.back();
        }, 300);
      } else {
        cardRef.current.style.transform = 'translateX(0px)';
      }
    }
    touchStartX.current = 0;
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 sm:p-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">Tambah Catatan Baru</h2>
        <Card
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="touch-pan-y"
        >
          <CardHeader>
            <CardTitle>Detail Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Pihak</FormLabel>
                        <FormControl>
                          <Input placeholder="cth: Budi Santoso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="cth: 500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis transaksi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hutang">Hutang</SelectItem>
                            <SelectItem value="piutang">Piutang</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status pembayaran" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="belum lunas">Belum Lunas</SelectItem>
                            <SelectItem value="lunas">Lunas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Transaksi</FormLabel>
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
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Jatuh Tempo</FormLabel>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Deskripsi (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tulis deskripsi singkat mengenai transaksi..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Deskripsi akan membantu Anda mengingat detail transaksi.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end">
                   <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Catatan
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
