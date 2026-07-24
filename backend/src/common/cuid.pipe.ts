import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Валидирует, что строковый параметр соответствует формату CUID (используется в Prisma @default(cuid())).
 * Замена для несуществующего ParseCuidPipe.
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || !/^[a-z0-9]{5,}$/i.test(value)) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}
