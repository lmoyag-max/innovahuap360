import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpsertTaskDto } from './dto/upsert-task.dto';
import { SetFeasibilityDto } from './dto/set-feasibility.dto';
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
  addTask(@Param('id') id: string, @Body() dto: UpsertTaskDto) {
    return this.service.addTask(id, dto);
  }

  @Patch('projects/:id/tasks/:taskId')
  @RequirePermissions('projects.manage')
  updateTask(@Param('id') id: string, @Param('taskId') taskId: string, @Body() dto: UpsertTaskDto) {
    return this.service.updateTask(id, taskId, dto);
  }

  @Delete('projects/:id/tasks/:taskId')
  @RequirePermissions('projects.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.service.removeTask(id, taskId);
  }

  @Put('projects/:id/feasibility')
  @RequirePermissions('projects.manage')
  setFeasibility(@Param('id') id: string, @Body() dto: SetFeasibilityDto) {
    return this.service.setFeasibility(id, dto);
  }
}
