import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Power, KeyRound } from 'lucide-react'
import { Eyebrow, Badge } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

interface Role { id: string; key: string; name: string }
interface UserRow {
  id: string
  email: string
  fullName: string
  initials: string
  position: string | null
  isActive: boolean
  role: Role
}

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(3, 'Mínimo 3 caracteres'),
  roleId: z.string().min(1, 'Selecciona un rol'),
  position: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Usuarios() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: users, isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data,
  })
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['admin-roles-list'],
    queryFn: async () => (await api.get('/admin/roles')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/admin/users', values),
    onSuccess: () => { invalidate(); setShowForm(false); reset() },
  })
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/users/${id}/active`, { isActive }),
    onSuccess: invalidate,
  })
  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.patch(`/admin/users/${id}/reset-password`, { newPassword }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleResetPassword = (id: string) => {
    const newPassword = prompt('Nueva contraseña temporal (mín. 8 caracteres):')
    if (newPassword && newPassword.length >= 8) {
      resetPassword.mutate({ id, newPassword }, {
        onSuccess: () => alert('Contraseña restablecida. El usuario deberá cambiarla al ingresar.'),
        onError: (e) => alert(apiErrorMessage(e)),
      })
    }
  }

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <Eyebrow>ADMINISTRACIÓN</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Usuarios</h1>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cerrar' : 'Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-5">
          {createMutation.error && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Nombre completo</span>
              <input {...register('fullName')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.fullName && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.fullName.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Correo institucional</span>
              <input {...register('email')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.email && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.email.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Cargo</span>
              <input {...register('position')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Rol</span>
              <select {...register('roleId')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
                <option value="">Selecciona…</option>
                {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.roleId && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.roleId.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Contraseña temporal</span>
              <input type="password" {...register('password')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.password && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.password.message}</span>}
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={createMutation.isPending} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {createMutation.isPending ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && users && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 shrink-0 rounded-full bg-sunken text-muted flex items-center justify-center text-[10px] font-bold font-mono">{u.initials}</span>
                      <div>
                        <div className="text-ink font-medium leading-tight">{u.fullName}</div>
                        <div className="text-muted text-[11.5px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body">{u.role.name}</td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <Badge color="var(--green-600)" bg="var(--green-50)">ACTIVO</Badge>
                    ) : (
                      <Badge color="var(--accent-700)" bg="var(--accent-50)">INACTIVO</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title={u.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Power size={14} />
                      </button>
                      <button title="Restablecer contraseña" onClick={() => handleResetPassword(u.id)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
