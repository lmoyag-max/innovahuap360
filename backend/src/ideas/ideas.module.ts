import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { AuditModule } from '../audit/audit.module';
import { UploadsModule } from '../uploads/uploads.module';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';

@Module({
  imports: [MailModule, AuditModule, UploadsModule],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
