import { Module } from '@nestjs/common';
import { InnovaIaController } from './innovaia.controller';
import { InnovaIaService } from './innovaia.service';

@Module({
  controllers: [InnovaIaController],
  providers: [InnovaIaService],
})
export class InnovaIaModule {}
