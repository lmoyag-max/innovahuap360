import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AuditModule } from '../audit/audit.module';
import { FactibilidadController } from './factibilidad.controller';
import { FactibilidadService } from './factibilidad.service';

@Module({
  imports: [ProjectsModule, UploadsModule, AuditModule],
  controllers: [FactibilidadController],
  providers: [FactibilidadService],
})
export class FactibilidadModule {}
