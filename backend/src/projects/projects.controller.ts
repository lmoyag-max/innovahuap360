import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpsertTaskDto } from './dto/upsert-task.dto';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { AttachTaskFileDto } from './dto/attach-task-file.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { SetFeasibilityDto } from './dto/set-feasibility.dto';
import { TransitionStageDto } from './dto/transition-stage.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller()
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Public()
  @Get('public/projects')
  findPublic() {
    return this.service.findPublic();
  }

  @Get('projects')
  @RequirePermissions('projects.read')
  findAll() {
    return this.service.findAll();
  }

  @Get('projects/:id')
  @RequirePermissions('projects.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('projects')
  @RequirePermissions('projects.manage')
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  @Patch('projects/:id')
  @RequirePermissions('projects.manage')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete('projects/:id')
  @RequirePermissions('projects.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('projects/:id/tasks')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  addTask(@Param('id') id: string, @Body() dto: UpsertTaskDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.addTask(id, dto, user.fullName);
  }

  @Patch('projects/:id/tasks/reorder')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  reorderTasks(@Param('id') id: string, @Body() dto: ReorderTasksDto) {
    return this.service.reorderTasks(id, dto);
  }

  @Patch('projects/:id/tasks/:taskId')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpsertTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateTask(id, taskId, dto, user.fullName);
  }

  @Delete('projects/:id/tasks/:taskId')
  @RequirePermissions('projects.tasks.delete')
  @RequireModule('gantt')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTask(@Param('id') id: string, @Param('taskId') taskId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.removeTask(id, taskId, user.fullName);
  }

  @Get('projects/:id/tasks/:taskId/history')
  @RequirePermissions('projects.read')
  @RequireModule('gantt')
  getTaskHistory(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.service.getTaskHistory(id, taskId);
  }

  @Post('projects/:id/tasks/:taskId/dependencies')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  addDependency(@Param('id') id: string, @Param('taskId') taskId: string, @Body() dto: CreateTaskDependencyDto) {
    return this.service.addDependency(id, taskId, dto);
  }

  @Delete('projects/:id/tasks/:taskId/dependencies/:dependsOnId')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDependency(@Param('id') id: string, @Param('taskId') taskId: string, @Param('dependsOnId') dependsOnId: string) {
    return this.service.removeDependency(id, taskId, dependsOnId);
  }

  @Post('projects/:id/tasks/:taskId/attachments')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  addAttachment(@Param('id') id: string, @Param('taskId') taskId: string, @Body() dto: AttachTaskFileDto) {
    return this.service.addAttachment(id, taskId, dto);
  }

  @Delete('projects/:id/tasks/:taskId/attachments/:attachmentId')
  @RequirePermissions('projects.manage')
  @RequireModule('gantt')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAttachment(@Param('id') id: string, @Param('taskId') taskId: string, @Param('attachmentId') attachmentId: string) {
    return this.service.removeAttachment(id, taskId, attachmentId);
  }

  @Put('projects/:id/feasibility')
  @RequirePermissions('projects.manage')
  setFeasibility(@Param('id') id: string, @Body() dto: SetFeasibilityDto) {
    return this.service.setFeasibility(id, dto);
  }

  @Patch('projects/:id/stage')
  @RequirePermissions('projects.manage')
  transitionStage(@Param('id') id: string, @Body() dto: TransitionStageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.transitionStage(id, dto, user.fullName);
  }

  @Get('projects/:id/stage-history')
  @RequirePermissions('projects.read')
  getStageHistory(@Param('id') id: string) {
    return this.service.getStageHistory(id);
  }
}
