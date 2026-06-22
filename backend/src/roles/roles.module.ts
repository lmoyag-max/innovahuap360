import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { ModulesController } from './modules.controller';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController, ModulesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
