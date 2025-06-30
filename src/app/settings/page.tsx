'use client';

import MainLayout from '@/components/layout/main-layout';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload } from 'lucide-react';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
        <p className="text-muted-foreground">
          Sesuaikan preferensi aplikasi Anda di sini.
        </p>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tampilan</CardTitle>
              <CardDescription>
                Ubah tampilan aplikasi agar sesuai dengan preferensi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Tema Aplikasi</h3>
                  <p className="text-sm text-muted-foreground">Pilih antara tema terang, gelap, atau sistem.</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Keuangan</CardTitle>
              <CardDescription>
                Kelola pengaturan terkait keuangan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mata Uang Default</h3>
                  <p className="text-sm text-muted-foreground">Pilih mata uang utama untuk transaksi.</p>
                </div>
                <Select defaultValue="IDR">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pilih mata uang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                    <SelectItem value="USD">USD - Dolar AS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
              <CardDescription>
                Kelola data aplikasi Anda dengan aman.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Cadangkan Data</h3>
                  <p className="text-sm text-muted-foreground">Simpan salinan data Anda ke file lokal.</p>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Cadangkan
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Pulihkan Data</h3>
                  <p className="text-sm text-muted-foreground">Pulihkan data dari file cadangan.</p>
                </div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Pulihkan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
