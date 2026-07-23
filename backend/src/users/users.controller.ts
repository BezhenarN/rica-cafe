import { Body, Controller, Delete, Get, Param, ParseCuidPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { AddressDto, UpdateProfileDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('users/me')
  @ApiOperation({ summary: 'Обновить профиль' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Get('users/me/addresses')
  @ApiOperation({ summary: 'Список адресов доставки' })
  listAddresses(@CurrentUser('id') userId: string) {
    return this.users.listAddresses(userId);
  }

  @Post('users/me/addresses')
  @ApiOperation({ summary: 'Добавить адрес доставки' })
  createAddress(@CurrentUser('id') userId: string, @Body() dto: AddressDto) {
    return this.users.createAddress(userId, dto);
  }

  @Patch('users/me/addresses/:id')
  @ApiOperation({ summary: 'Редактировать адрес' })
  updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: AddressDto,
  ) {
    return this.users.updateAddress(userId, id, dto);
  }

  @Delete('users/me/addresses/:id')
  @ApiOperation({ summary: 'Удалить адрес' })
  deleteAddress(@CurrentUser('id') userId: string, @Param('id', ParseCuidPipe) id: string) {
    return this.users.deleteAddress(userId, id);
  }

  @Post('users/me/addresses/:id/default')
  @ApiOperation({ summary: 'Сделать адрес основным' })
  setDefault(@CurrentUser('id') userId: string, @Param('id', ParseCuidPipe) id: string) {
    return this.users.setDefaultAddress(userId, id);
  }
}
