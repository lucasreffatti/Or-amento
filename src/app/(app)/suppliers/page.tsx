import { getSuppliers } from '@/app/actions/supplier'
import SuppliersClient from './SuppliersClient'

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()
  return <SuppliersClient initialSuppliers={suppliers} />
}
