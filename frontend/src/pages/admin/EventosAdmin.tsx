import SectionItemsAdmin from './SectionItemsAdmin'

const ITEM_TYPES = [
  { value: 'SESIÓN', label: 'Sesión' },
  { value: 'JORNADA', label: 'Jornada' },
  { value: 'CAPACITACIÓN', label: 'Capacitación' },
  { value: 'CONVOCATORIA', label: 'Convocatoria' },
  { value: 'TALLER', label: 'Taller' },
  { value: 'CHARLA', label: 'Charla' },
]

export default function EventosAdmin() {
  return <SectionItemsAdmin section="EVENTOS" itemTypeOptions={ITEM_TYPES} showEventFields />
}
