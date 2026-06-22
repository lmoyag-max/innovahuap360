import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AskInnovaIaDto } from './dto/ask.dto';
import { InnovaIaService } from './innovaia.service';

const PROMPT_SUMMARY_LENGTH = 120;

@ApiTags('innovaia')
@Controller('innovaia')
@RequirePermissions('innovaia.use')
@RequireModule('innovaia')
export class InnovaIaController {
  constructor(
    private readonly service: InnovaIaService,
    private readonly auditService: AuditService,
  ) {}

  @Get('capabilities')
  getCapabilities() {
    return this.service.getCapabilities();
  }

  @Post('ask')
  async ask(@Body() dto: AskInnovaIaDto, @CurrentUser() currentUser: AuthenticatedUser) {
    const promptSummary = dto.prompt.slice(0, PROMPT_SUMMARY_LENGTH);
    try {
      const result = await this.service.ask(dto.prompt);
      await this.auditService.log({
        userId: currentUser.sub,
        action: 'innovaia.ask',
        metadata: { promptSummary, status: 'success', provider: result.provider },
      });
      return result;
    } catch (error) {
      await this.auditService.log({
        userId: currentUser.sub,
        action: 'innovaia.ask',
        metadata: { promptSummary, status: 'error', error: (error as Error)?.message },
      });
      throw error;
    }
  }
}
