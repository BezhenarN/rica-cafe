import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Достаёт аутентифицированного пользователя из запроса.
 * @example  getUser(@CurrentUser() user) {}
 * Также поддерживает извлечение одного поля: @CurrentUser('id')
 */
export const CurrentUser = createParamDecorator((data: keyof any | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return data ? req.user?.[data] : req.user;
});
