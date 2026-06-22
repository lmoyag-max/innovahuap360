import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { ModuleAccessGuard } from './common/guards/module-access.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PublicContentModule } from './public-content/public-content.module';
import { ProjectsModule } from './projects/projects.module';
import { MinutesModule } from './minutes/minutes.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { CommunicationsModule } from './communications/communications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuditModule } from './audit/audit.module';
import { MailModule } from './mail/mail.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { InnovaIaModule } from './innovaia/innovaia.module';
import { IdeasModule } from './ideas/ideas.module';
import { UnitsModule } from './units/units.module';
import { FactibilidadModule } from './factibilidad/factibilidad.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }] }),
    PrismaModule,

    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PublicContentModule,
    ProjectsModule,
    MinutesModule,
    KnowledgeModule,
    CommunicationsModule,
    DashboardModule,
    UploadsModule,
    AuditModule,
    MailModule,
    SettingsModule,
    HealthModule,
    InnovaIaModule,
    IdeasModule,
    UnitsModule,
    FactibilidadModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ModuleAccessGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
