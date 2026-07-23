import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Защищает маршрут JWT-проверкой; req.user заполняется из токена. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
