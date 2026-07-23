import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Иван Петров' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+7 900 123-45-67' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class AddressDto {
  @ApiPropertyOptional({ example: 'Дом' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiProperty({ example: 'ул. Ленина' })
  @IsString()
  @MaxLength(200)
  street!: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @MaxLength(20)
  building!: string;

  @ApiPropertyOptional({ example: '42' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  apt?: string;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  floor?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  entrance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;
}
