import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Save, Search, CheckCircle2, Circle,
  LayoutGrid, Lightbulb, FolderKanban, FileText, ClipboardCheck, GanttChartSquare,
  BookOpen, Megaphone, Sparkles, BarChart3, ShieldCheck, UserCog, Building2,
  KeyRound, Settings, Mail, ScrollText, type LucideIcon,
} from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

interface Permission { id: string; key: string }
interface ModuleDef { id: string; key: string; name: string; groupKey: string; groupLabel: string; sortOrder: number }
interface Role {
  id: string
  key: string
  name: string
  permissions: { permission: Permission }[]
  moduleAccess: { module: ModuleDef }[]
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutGrid,
  ideas: Lightbulb,
  projects: FolderKanban,
  minutes: FileText,
  factibilidad: ClipboardCheck,
  gantt: GanttChartSquare,
  knowledge: BookOpen,
  communications: Megaphone,
  innovaia: Sparkles,
  executive: BarChart3,
  public_content: ShieldCheck,
  users: UserCog,
  units: Building2,
  roles: KeyRound,
  settings: Settings,
  mail: Mail,
  audit: ScrollText,
}

type Tab = 'permisos' | 'modulos'

export default function Roles() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('permisos')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<string>>(new Set())
  const [draftModuleIds, setDraftModuleIds] = useState<Set<string>>(new Set())
  const [moduleSearch, setModuleSearch] = useState('')

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get('/admin/roles')).data,
  })
  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ['admin-permissions'],
    queryFn: async () => (await api.get('/admin/permissions')).data,
  })
  const { data: modules } = useQuery<ModuleDef[]>({
    queryKey: ['admin-modules'],
    queryFn: async () => (await api.get('/admin/modules')).data,
  })

  const savePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      api.put(`/admin/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-roles'] }),
  })
  const saveModulesMutation = useMutation({
    mutationFn: ({ roleId, moduleIds }: { roleId: string; moduleIds: string[] }) =>
      api.put(`/admin/roles/${roleId}/modules`, { moduleIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-roles'] }),
  })

  const selectRole = (role: Role) => {
    setSelectedRoleId(role.id)
    setDraftPermissionIds(new Set(role.permissions.map((p) => p.permission.id)))
    setDraftModuleIds(new Set(role.moduleAccess.map((m) => m.module.id)))
  }

  const togglePermission = (id: string) => {
    setDraftPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleModule = (id: string) => {
    setDraftModuleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedRole = roles?.find((r) => r.id === selectedRoleId)

  const groupedModules = useMemo(() => {
    const filtered = (modules ?? []).filter((m) => m.name.toLowerCase().includes(moduleSearch.trim().toLowerCase()))
    const groups = new Map<string, { groupLabel: string; modules: ModuleDef[] }>()
    for (const m of filtered) {
      if (!groups.has(m.groupKey)) groups.set(m.groupKey, { groupLabel: m.groupLabel, modules: [] })
      groups.get(m.groupKey)!.modules.push(m)
    }
    return Array.from(groups.values())
  }, [modules, moduleSearch])

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Roles y permisos</h1>

      <div className="flex items-center gap-1.5 mb-5 border-b border-line">
        {([
          ['permisos', 'Permisos'],
          ['modulos', 'Acceso a Módulos'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              tab === key ? '' : 'border-transparent text-muted hover:text-body'
            }`}
            style={tab === key ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

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

        {tab === 'permisos' && (
          <div className="bg-card border border-line rounded-card p-5">
            {!selectedRole && <p className="text-[13px] text-muted">Selecciona un rol para ver y editar sus permisos.</p>}
            {selectedRole && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-ink">Permisos de «{selectedRole.name}»</h3>
                  <button
                    onClick={() => savePermissionsMutation.mutate({ roleId: selectedRole.id, permissionIds: Array.from(draftPermissionIds) })}
                    disabled={savePermissionsMutation.isPending}
                    className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Save size={14} /> {savePermissionsMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
                {savePermissionsMutation.error && (
                  <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(savePermissionsMutation.error)}</p>
                )}
                {savePermissionsMutation.isSuccess && (
                  <p className="text-[12.5px] mb-3" style={{ color: 'var(--green-600)' }}>Permisos actualizados.</p>
                )}
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
        )}

        {tab === 'modulos' && (
          <div className="bg-card border border-line rounded-card p-5">
            {!selectedRole && <p className="text-[13px] text-muted">Selecciona un rol para ver y editar sus módulos visibles.</p>}
            {selectedRole && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-[15px] font-bold text-ink">Módulos visibles para «{selectedRole.name}»</h3>
                    <p className="text-[12px] text-muted mt-0.5">
                      Capa adicional a los permisos: si un módulo está inactivo aquí, el rol no lo verá en el menú ni podrá
                      abrirlo, aunque tenga el permiso funcional correspondiente.
                    </p>
                  </div>
                  <button
                    onClick={() => saveModulesMutation.mutate({ roleId: selectedRole.id, moduleIds: Array.from(draftModuleIds) })}
                    disabled={saveModulesMutation.isPending}
                    className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60 shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Save size={14} /> {saveModulesMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
                {saveModulesMutation.error && (
                  <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveModulesMutation.error)}</p>
                )}
                {saveModulesMutation.isSuccess && (
                  <p className="text-[12.5px] mb-3" style={{ color: 'var(--green-600)' }}>Acceso a módulos actualizado.</p>
                )}

                <div className="relative mb-4 max-w-[320px]">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Buscar módulo…"
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[12.5px] outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex flex-col gap-5">
                  {groupedModules.map((group) => (
                    <div key={group.groupLabel}>
                      <div className="font-mono text-[10px] tracking-[0.12em] text-subtle mb-2">{group.groupLabel.toUpperCase()}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {group.modules.map((m) => {
                          const Icon = MODULE_ICONS[m.key] ?? LayoutGrid
                          const active = draftModuleIds.has(m.id)
                          return (
                            <button
                              key={m.id}
                              onClick={() => toggleModule(m.id)}
                              className={`text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                                active ? '' : 'border-line bg-inset opacity-75'
                              }`}
                              style={active ? { borderColor: 'var(--green-100)', background: 'var(--green-50)' } : undefined}
                            >
                              <span
                                className={`w-9 h-9 shrink-0 rounded-md flex items-center justify-center ${active ? '' : 'bg-hover text-muted'}`}
                                style={active ? { background: 'linear-gradient(135deg,var(--green-500),var(--green-600))', color: 'white' } : undefined}
                              >
                                <Icon size={17} />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-[12.5px] font-semibold text-ink truncate">{m.name}</span>
                                <span className={`block text-[11px] font-medium ${active ? '' : 'text-muted'}`} style={active ? { color: 'var(--green-600)' } : undefined}>
                                  {active ? 'Activo' : 'Inactivo'}
                                </span>
                              </span>
                              {active ? (
                                <CheckCircle2 size={18} style={{ color: 'var(--green-500)' }} className="shrink-0" />
                              ) : (
                                <Circle size={18} className="text-subtle shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
