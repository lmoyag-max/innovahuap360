import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Power, KeyRound, Pencil, Trash2 } from 'lucide-react'
import { Eyebrow, Badge } from '../../components/ui'
import { Modal } from '../../components/ui/Modal'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

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

const createSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(3, 'Mínimo 3 caracteres'),
  roleId: z.string().min(1, 'Selecciona un rol'),
  position: z.string().optional(),
})
type CreateValues = z.infer<typeof createSchema>

const editSchema = z.object({
  email: z.string().email('Correo inválido'),
  fullName: z.string().min(3, 'Mínimo 3 caracteres'),
  roleId: z.string().min(1, 'Selecciona un rol'),
  position: z.string().optional(),
})
type EditValues = z.infer<typeof editSchema>

export default function Usuarios() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canDelete = hasPermission('users.delete')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

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
    mutationFn: (values: CreateValues) => api.post('/admin/users', values),
    onSuccess: () => {
      invalidate()
      setShowForm(false)
      resetCreate()
      setFeedback({ ok: true, message: 'Usuario creado correctamente.' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditValues }) => api.patch(`/admin/users/${id}`, values),
    onSuccess: () => {
      invalidate()
      setEditingUser(null)
      setFeedback({ ok: true, message: 'Usuario actualizado correctamente.' })
    },
    onError: (e) => setFeedback({ ok: false, message: apiErrorMessage(e) }),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/users/${id}/active`, { isActive }),
    onSuccess: (_data, vars) => {
      invalidate()
      setFeedback({ ok: true, message: vars.isActive ? 'Usuario activado.' : 'Usuario desactivado.' })
    },
    onError: (e) => setFeedback({ ok: false, message: apiErrorMessage(e) }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      invalidate()
      setFeedback({ ok: true, message: 'Usuario eliminado correctamente.' })
    },
    onError: (e) => setFeedback({ ok: false, message: apiErrorMessage(e) }),
  })

  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.patch(`/admin/users/${id}/reset-password`, { newPassword }),
  })

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateValues>({ resolver: zodResolver(createSchema) })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) })

  const openEdit = (user: UserRow) => {
    setEditingUser(user)
    resetEdit({ email: user.email, fullName: user.fullName, roleId: user.role.id, position: user.position ?? '' })
  }

  const handleDelete = (user: UserRow) => {
    if (confirm(`¿Eliminar al usuario «${user.fullName}» (${user.email})? Ya no podrá iniciar sesión. Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleResetPassword = (id: string) => {
    const newPassword = prompt('Nueva contraseña temporal (mín. 8 caracteres):')
    if (newPassword && newPassword.length >= 8) {
      resetPassword.mutate({ id, newPassword }, {
        onSuccess: () => setFeedback({ ok: true, message: 'Contraseña restablecida. El usuario deberá cambiarla al ingresar.' }),
        onError: (e) => setFeedback({ ok: false, message: apiErrorMessage(e) }),
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

      {feedback && (
        <p className="text-[12.5px] mb-3" style={{ color: feedback.ok ? 'var(--green-600)' : 'var(--accent)' }}>
          {feedback.message}
        </p>
      )}

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-5">
          {createMutation.error && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
          <form onSubmit={handleSubmitCreate((v) => createMutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Nombre completo</span>
              <input {...registerCreate('fullName')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {createErrors.fullName && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{createErrors.fullName.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Correo institucional</span>
              <input {...registerCreate('email')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {createErrors.email && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{createErrors.email.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Cargo</span>
              <input {...registerCreate('position')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Rol</span>
              <select {...registerCreate('roleId')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
                <option value="">Selecciona…</option>
                {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {createErrors.roleId && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{createErrors.roleId.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Contraseña temporal</span>
              <input type="password" {...registerCreate('password')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {createErrors.password && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{createErrors.password.message}</span>}
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
                <th className="px-4 py-3 font-semibold w-[160px]">Acciones</th>
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
                      <button title="Editar" onClick={() => openEdit(u)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Pencil size={14} />
                      </button>
                      <button title={u.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Power size={14} />
                      </button>
                      <button title="Restablecer contraseña" onClick={() => handleResetPassword(u.id)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <KeyRound size={14} />
                      </button>
                      {canDelete && (
                        <button title="Eliminar" onClick={() => handleDelete(u)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={`Editar «${editingUser?.fullName ?? ''}»`}>
        {editingUser && (
          <form
            onSubmit={handleSubmitEdit((v) => updateMutation.mutate({ id: editingUser.id, values: v }))}
            className="grid grid-cols-1 gap-3.5"
          >
            {updateMutation.error && <p className="text-[12.5px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(updateMutation.error)}</p>}
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Nombre completo</span>
              <input {...registerEdit('fullName')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {editErrors.fullName && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{editErrors.fullName.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Correo institucional</span>
              <input {...registerEdit('email')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {editErrors.email && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{editErrors.email.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Cargo</span>
              <input {...registerEdit('position')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Rol</span>
              <select {...registerEdit('roleId')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
                {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {editErrors.roleId && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{editErrors.roleId.message}</span>}
            </label>
            <div className="flex items-center gap-2.5 justify-end mt-1">
              <button type="button" onClick={() => setEditingUser(null)} className="h-10 px-4 rounded-md border border-line font-semibold text-[13px] text-body">
                Cancelar
              </button>
              <button type="submit" disabled={updateMutation.isPending} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {updateMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
