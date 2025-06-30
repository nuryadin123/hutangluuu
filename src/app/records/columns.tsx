"use client"

import { ColumnDef, RowData } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DebtRecord } from "@/lib/types"
import { format } from "date-fns"
import { id as localeId } from 'date-fns/locale';

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onViewDetails: (record: TData) => void;
    onDeleteRecord: (record: TData) => void;
  }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};


export const columns: ColumnDef<DebtRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Pihak
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row, table }) => (
        <Button
            variant="link"
            className="p-0 h-auto font-medium text-left"
            onClick={() => table.options.meta?.onViewDetails(row.original)}
        >
            {row.getValue("name")}
        </Button>
    ),
  },
  {
    accessorKey: "type",
    header: "Jenis",
     cell: ({ row }) => {
      const type = row.original.type;
      return <Badge variant={type === 'hutang' ? 'destructive' : 'default'}>{type}</Badge>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;
      if (record.status === 'lunas') {
        return <Badge variant="secondary">Lunas</Badge>;
      }

      const totalPaid = record.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const remainingAmount = record.amount - totalPaid;

      return (
        <div>
          <Badge variant="outline">{record.status}</Badge>
          {remainingAmount > 0 && (
             <div className="text-xs text-muted-foreground pt-1">
              Sisa: {formatCurrency(remainingAmount)}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Jumlah
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      return <div className="text-right font-mono">{formatCurrency(amount)}</div>
    },
  },
    {
    accessorKey: "dueDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Jatuh Tempo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("dueDate"));
      return format(date, "d MMM yyyy", { locale: localeId });
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const record = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.id)}
            >
              Salin ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => table.options.meta?.onViewDetails(record)}>
                Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem>Ubah</DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => table.options.meta?.onDeleteRecord(record)}
            >
                Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
