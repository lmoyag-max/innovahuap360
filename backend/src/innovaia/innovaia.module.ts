import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InnovaIaController } from './innovaia.controller';
import { InnovaIaService } from './innovaia.service';

@Module({
  imports: [AuditModule],
  controllers: [InnovaIaController],
  providers: [InnovaIaService],
})
export class InnovaIaModule {}
