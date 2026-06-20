-- CreateTable
CREATE TABLE "project_stage_history" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "from_stage" "ProjectStage" NOT NULL,
    "to_stage" "ProjectStage" NOT NULL,
    "changed_by_name" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_stage_history_project_id_idx" ON "project_stage_history"("project_id");

-- AddForeignKey
ALTER TABLE "project_stage_history" ADD CONSTRAINT "project_stage_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
