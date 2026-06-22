-- CreateEnum
CREATE TYPE "FichaFactibilidadStatus" AS ENUM ('BORRADOR', 'EN_EVALUACION', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "CriterioCategoria" AS ENUM ('TECNICA', 'OPERACIONAL', 'NORMATIVA');

-- CreateEnum
CREATE TYPE "FactibilidadResultado" AS ENUM ('FACTIBLE', 'FACTIBLE_CON_OBSERVACIONES', 'REQUIERE_MAYOR_ANALISIS', 'NO_FACTIBLE');

-- CreateEnum
CREATE TYPE "RiesgoProbabilidad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "RiesgoImpacto" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "RiesgoNivel" AS ENUM ('BAJO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateTable
CREATE TABLE "factibilidad_fichas" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "evaluation_date" TIMESTAMP(3) NOT NULL,
    "responsible_name" TEXT NOT NULL,
    "unit_id" TEXT,
    "project_stage_snapshot" "ProjectStage" NOT NULL,
    "evaluation_objective" TEXT,
    "description" TEXT,
    "status" "FichaFactibilidadStatus" NOT NULL DEFAULT 'BORRADOR',
    "estimated_costs" TEXT,
    "required_resources" TEXT,
    "licenses" TEXT,
    "infrastructure_costs" TEXT,
    "man_hours" INTEGER,
    "recurring_costs" TEXT,
    "expected_benefit" TEXT,
    "global_score" INTEGER,
    "result" "FactibilidadResultado",
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factibilidad_fichas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factibilidad_criterios" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "categoria" "CriterioCategoria" NOT NULL,
    "criterion_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factibilidad_criterios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factibilidad_riesgos" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "probability" "RiesgoProbabilidad" NOT NULL,
    "impact" "RiesgoImpacto" NOT NULL,
    "level" "RiesgoNivel" NOT NULL,
    "mitigation" TEXT,
    "responsible" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factibilidad_riesgos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factibilidad_evidencias" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factibilidad_evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "factibilidad_fichas_project_id_idx" ON "factibilidad_fichas"("project_id");

-- CreateIndex
CREATE INDEX "factibilidad_fichas_status_idx" ON "factibilidad_fichas"("status");

-- CreateIndex
CREATE INDEX "factibilidad_fichas_deleted_at_idx" ON "factibilidad_fichas"("deleted_at");

-- CreateIndex
CREATE INDEX "factibilidad_criterios_ficha_id_categoria_idx" ON "factibilidad_criterios"("ficha_id", "categoria");

-- CreateIndex
CREATE INDEX "factibilidad_riesgos_ficha_id_idx" ON "factibilidad_riesgos"("ficha_id");

-- CreateIndex
CREATE UNIQUE INDEX "factibilidad_evidencias_upload_id_key" ON "factibilidad_evidencias"("upload_id");

-- CreateIndex
CREATE INDEX "factibilidad_evidencias_ficha_id_idx" ON "factibilidad_evidencias"("ficha_id");

-- AddForeignKey
ALTER TABLE "factibilidad_fichas" ADD CONSTRAINT "factibilidad_fichas_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factibilidad_fichas" ADD CONSTRAINT "factibilidad_fichas_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factibilidad_criterios" ADD CONSTRAINT "factibilidad_criterios_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "factibilidad_fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factibilidad_riesgos" ADD CONSTRAINT "factibilidad_riesgos_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "factibilidad_fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factibilidad_evidencias" ADD CONSTRAINT "factibilidad_evidencias_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "factibilidad_fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factibilidad_evidencias" ADD CONSTRAINT "factibilidad_evidencias_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

