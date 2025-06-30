'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Users,
  PlusCircle,
  FileBarChart,
} from 'lucide-react';
import Header from './header';
import { Button } from '@/components/ui/button';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Wallet className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">DebtFlow</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/')}
                tooltip={{ children: 'Dasbor' }}
              >
                <Link href="/">
                  <LayoutDashboard />
                  <span>Dasbor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/records')}
                tooltip={{ children: 'Catatan' }}
              >
                <Link href="/records">
                  <FileText />
                  <span>Catatan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/reports')}
                tooltip={{ children: 'Laporan' }}
              >
                <Link href="/reports">
                  <FileBarChart />
                  <span>Laporan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/customers')}
                tooltip={{ children: 'Pelanggan' }}
              >
                <Link href="/customers">
                  <Users />
                  <span>Pelanggan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2">
            <Button asChild className="w-full justify-start">
              <Link href="/add">
                <PlusCircle className="mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Tambah Baru
                </span>
              </Link>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 animate-content-show">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
