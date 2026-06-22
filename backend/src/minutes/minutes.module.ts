import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { MinutesController } from './minutes.controller';
import { MinutesService } from './minutes.service';

@Module({
  imports: [UploadsModule],
  controllers: [MinutesController],
  providers: [MinutesService],
})
export class MinutesModule {}
