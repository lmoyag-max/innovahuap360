import { useQuery } from '@tanstack/react-query'
import { Eyebrow } from '../../components/ui'
import { api } from '../../lib/api'

interface AuditLog {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  ip: string | null
  createdAt: string
  user: { fullName: string; email: string } | null
}

export default function Auditoria() {
  const { data, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['admin-audit'],
    queryFn: async () => (await api.get('/admin/audit', { params: { take: 100 } })).data,
  })

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Auditoría</h1>

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && data?.length === 0 && <p className="p-5 text-[13px] text-muted">Sin actividad registrada.</p>}
        {!isLoading && data && data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Acción</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-[11.5px] text-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-body">{log.user?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink">{log.action}</td>
                  <td className="px-4 py-3 text-muted font-mono text-[11.5px]">{log.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
