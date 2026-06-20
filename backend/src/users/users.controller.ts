import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString, MinLength } from 'class-validator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@ApiTags('users')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users.manage')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/active')
  @RequirePermissions('users.manage')
  setActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.usersService.setActive(id, dto.isActive);
  }

  @Patch(':id/reset-password')
  @RequirePermissions('users.manage')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPasswordByAdmin(id, dto.newPassword);
  }
}
