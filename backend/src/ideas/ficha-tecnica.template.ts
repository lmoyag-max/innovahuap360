import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';

const ACCENT = 'ED1D25';

function fieldRow(label: string, hint?: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ text: hint ?? '' }),
          new Paragraph({ text: '' }),
        ],
      }),
    ],
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, color: ACCENT, bold: true })],
  });
}

/** Genera la ficha técnica oficial del Comité de Innovación como .docx editable. */
export function buildFichaTecnicaDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'HUAP · Comité de Innovación', bold: true, color: ACCENT, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: 'Ficha Técnica de Proyecto de Innovación', size: 22 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text:
                  'Complete esta ficha y cárguela junto con su postulación en /postula. Es un documento ' +
                  'obligatorio para que el Comité pueda evaluar la factibilidad de su idea.',
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          sectionTitle('1. Descripción del problema'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [fieldRow('Problema u oportunidad', '¿Qué problema concreto resuelve esta idea?')],
          }),

          sectionTitle('2. Propuesta de solución'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              fieldRow('Descripción de la solución', 'Explique en qué consiste la idea o proyecto.'),
              fieldRow('Población objetivo / beneficiarios', ''),
              fieldRow('Recursos requeridos (estimado)', 'Personas, equipamiento, presupuesto referencial, etc.'),
            ],
          }),

          sectionTitle('3. Impacto esperado'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              fieldRow('Impacto clínico / asistencial', ''),
              fieldRow('Impacto en gestión / eficiencia', ''),
              fieldRow('Indicador(es) propuesto(s) de éxito', ''),
            ],
          }),

          sectionTitle('4. Riesgos y dependencias'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [fieldRow('Riesgos identificados', '¿Qué podría impedir o dificultar la ejecución?')],
          }),

          new Paragraph({ spacing: { before: 400 }, text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Nombre de quien completa la ficha: ', bold: true }),
              new TextRun({ text: '____________________________' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 150 },
            children: [
              new TextRun({ text: 'Fecha: ', bold: true }),
              new TextRun({ text: '____ / ____ / ______' }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
