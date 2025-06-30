import MainLayout from "@/components/layout/main-layout"
import { getDebtRecords } from "@/services/debt-service"
import type { DebtRecord } from "@/lib/types"
import { DataTable } from "./data-table"
import { columns } from "./columns"

async function getData(): Promise<DebtRecord[]> {
  // Fetch data from your API here.
  return await getDebtRecords();
}

export default async function RecordsPage() {
  const data = await getData()

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
