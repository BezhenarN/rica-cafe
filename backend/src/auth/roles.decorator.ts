import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Помечает маршрут как доступный только указанным ролям.
 * Используется совместно с RolesGuard (JwtAuthGuard).
 * @example
 *   @Roles(Role.ADMIN)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
