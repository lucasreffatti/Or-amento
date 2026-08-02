import { getReportData } from '@/app/actions/report'
import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const response = await getReportData({ period: 'month', category: 'all' })

  return (
    <ReportsClient initialData={response.data || null} />
  )
}
