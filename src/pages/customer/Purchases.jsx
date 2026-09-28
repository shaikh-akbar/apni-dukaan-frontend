import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { purchaseColumns } from '../../components/columns'
import { Card, EmptyState, ErrorState, PageHeader, Pagination, Table } from '../../components/ui'
import { useCustomerAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { money, number } from '../../lib/format'

export default function CustomerPurchases() {
  const { session } = useCustomerAuth()
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi('/me/purchases', { page, pageSize: 15 })
  const { stats, settings } = session

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase history" subtitle={`${number(stats.totalPurchases)} purchases · ${number(stats.eligiblePurchases)} eligible · ${money(stats.totalSpent)} spent`} />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <Card padded={false}>
          <Table
            columns={purchaseColumns({ minAmount: settings.minPurchaseAmount })}
            rows={data?.items}
            loading={loading}
            empty={<EmptyState icon={Receipt} title="No purchases yet" message="Your purchases appear here once our staff record them at billing." />}
          />
          <Pagination meta={data?.meta} onPage={setPage} />
        </Card>
      )}
    </div>
  )
}
