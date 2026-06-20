import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

interface Permission { id: string; key: string }
interface Role { id: string; key: string; name: string; permissions: { permission: Permission }[] }

export default function Roles() {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<string>>(new Set())

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get('/admin/roles')).data,
  })
  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ['admin-permissions'],
    queryFn: async () => (await api.get('/admin/permissions')).data,
  })

  const saveMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      api.put(`/admin/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-roles'] }),
  })

  const selectRole = (role: Role) => {
    setSelectedRoleId(role.id)
    setDraftPermissionIds(new Set(role.permissions.map((p) => p.permission.id)))
  }

  const togglePermission = (id: string) => {
    setDraftPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedRole = roles?.find((r) => r.id === selectedRoleId)

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Roles y permisos</h1>

      {isLoading && <p className="text-[13px] text-muted">Cargando…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <div className="bg-card border border-line rounded-card p-3 flex flex-col gap-1 h-fit">
          {roles?.map((role) => (
            <button
              key={role.id}
              onClick={() => selectRole(role)}
              className={`text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                selectedRoleId === role.id ? 'font-bold' : 'text-body hover:bg-hover'
              }`}
              style={selectedRoleId === role.id ? { color: 'var(--accent)', background: 'var(--accent-50)' } : undefined}
            >
              {role.name}
              <span className="block text-[11px] text-muted font-mono">{role.key}</span>
            </button>
          ))}
        </div>

        <div className="bg-card border border-line rounded-card p-5">
          {!selectedRole && <p className="text-[13px] text-muted">Selecciona un rol para ver y editar sus permisos.</p>}
          {selectedRole && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-ink">Permisos de «{selectedRole.name}»</h3>
                <button
                  onClick={() => saveMutation.mutate({ roleId: selectedRole.id, permissionIds: Array.from(draftPermissionIds) })}
                  disabled={saveMutation.isPending}
                  className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}
                >
                  <Save size={14} /> {saveMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
              {saveMutation.error && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveMutation.error)}</p>}
              {saveMutation.isSuccess && <p className="text-[12.5px] mb-3" style={{ color: 'var(--green-600)' }}>Permisos actualizados.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {permissions?.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-line text-[12.5px] text-body cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftPermissionIds.has(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="font-mono">{perm.key}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
