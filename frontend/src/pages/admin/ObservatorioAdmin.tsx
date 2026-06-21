import SectionItemsAdmin from './SectionItemsAdmin'

const ITEM_TYPES = [
  { value: 'INDICADOR', label: 'Indicador' },
  { value: 'TENDENCIA', label: 'Tendencia' },
  { value: 'REPORTE', label: 'Reporte' },
  { value: 'ESTUDIO', label: 'Estudio' },
  { value: 'PUBLICACION', label: 'Publicación' },
]

export default function ObservatorioAdmin() {
  return <SectionItemsAdmin section="OBSERVATORIO" itemTypeOptions={ITEM_TYPES} />
}
