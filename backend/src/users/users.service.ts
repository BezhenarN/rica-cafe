import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AddressDto, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: AddressDto) {
    // Если первый адрес или помечен как default — снимаем флаг с остальных.
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const isFirst = count === 0;
      if (isFirst) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.create({ data: { ...dto, userId, isDefault: isFirst } });
    });
  }

  async updateAddress(userId: string, addressId: string, dto: AddressDto) {
    await this.getOwnedAddress(userId, addressId);
    return this.prisma.address.update({ where: { id: addressId }, data: dto });
  }

  async deleteAddress(userId: string, addressId: string) {
    await this.getOwnedAddress(userId, addressId);
    return this.prisma.address.delete({ where: { id: addressId } });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.getOwnedAddress(userId, addressId);
    await this.prisma.$transaction([
      this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      this.prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);
    return this.prisma.address.findUnique({ where: { id: addressId } });
  }

  private async getOwnedAddress(userId: string, addressId: string) {
    const addr = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!addr) throw new NotFoundException('Адрес не найден');
    return addr;
  }
}
