import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ServiceCenter, ShippedItem } from '@prisma/client';

import { randomUUID } from 'crypto';

@Injectable()
export class ServiceCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<(ServiceCenter & { items: ShippedItem[] })[]> {
    return this.prisma.serviceCenter.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<ServiceCenter & { items: ShippedItem[] }> {
    const branch = await this.prisma.serviceCenter.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!branch) {
      throw new NotFoundException(`Service Center with ID ${id} not found`);
    }
    return branch;
  }

  async create(data: Partial<ServiceCenter & { items: any[] }>): Promise<ServiceCenter> {
    return this.prisma.$transaction(async (tx) => {
      const branchId = data.id || randomUUID();

      const serviceCenter = await tx.serviceCenter.create({
        data: {
          id: branchId,
          name: data.name!,
          address: data.address || '',
          contact: data.contact || '',
          status: data.status || '문의접수',
          licensePath: data.licensePath,
          licenseName: data.licenseName,
          description: data.description || '',
          shippedAt: data.shippedAt ? new Date(data.shippedAt) : null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        },
      });

      const inputItems = data.items || [];
      for (const input of inputItems) {
        // Find stock item and deduct
        const item = await tx.item.findUnique({ where: { name: input.name } });
        if (item) {
          await tx.item.update({
            where: { id: item.id },
            data: { count: item.count - input.count },
          });
        }

        await tx.shippedItem.create({
          data: {
            serviceCenterId: branchId,
            itemId: item ? item.id : null,
            name: input.name,
            price: input.price,
            count: input.count,
          },
        });
      }

      return tx.serviceCenter.findUnique({
        where: { id: branchId },
        include: { items: true },
      }) as any;
    });
  }

  async update(id: string, data: Partial<ServiceCenter & { items: any[] }>): Promise<ServiceCenter> {
    return this.prisma.$transaction(async (tx) => {
      const oldBranch = await tx.serviceCenter.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!oldBranch) {
        throw new NotFoundException(`Service Center with ID ${id} not found`);
      }

      // Map existing shipped items
      const oldItemsMap = new Map<string, number>();
      for (const si of oldBranch.items || []) {
        oldItemsMap.set(si.name, (oldItemsMap.get(si.name) || 0) + si.count);
      }

      // Track new items
      const newItems = data.items || [];
      const newItemsMap = new Map<string, number>();
      for (const item of newItems) {
        newItemsMap.set(item.name, (newItemsMap.get(item.name) || 0) + item.count);
      }

      // 1. Calculate diff for new/updated items
      for (const [name, newCount] of newItemsMap.entries()) {
        const oldCount = oldItemsMap.get(name) || 0;
        const diff = oldCount - newCount; // diff > 0 stock returned, diff < 0 stock consumed

        if (diff !== 0) {
          const item = await tx.item.findUnique({ where: { name } });
          if (item) {
            await tx.item.update({
              where: { id: item.id },
              data: { count: item.count + diff },
            });
          }
        }
      }

      // 2. Return stock for deleted items
      for (const [name, oldCount] of oldItemsMap.entries()) {
        if (!newItemsMap.has(name)) {
          const item = await tx.item.findUnique({ where: { name } });
          if (item) {
            await tx.item.update({
              where: { id: item.id },
              data: { count: item.count + oldCount },
            });
          }
        }
      }

      // 3. Clear old ShippedItem records
      await tx.shippedItem.deleteMany({ where: { serviceCenterId: id } });

      // 4. Update ServiceCenter fields
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.contact !== undefined) updateData.contact = data.contact;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.licensePath !== undefined) updateData.licensePath = data.licensePath;
      if (data.licenseName !== undefined) updateData.licenseName = data.licenseName;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.shippedAt !== undefined) {
        updateData.shippedAt = data.shippedAt ? new Date(data.shippedAt) : null;
      }

      await tx.serviceCenter.update({
        where: { id },
        data: updateData,
      });

      // 5. Create new ShippedItem records
      for (const input of newItems) {
        const item = await tx.item.findUnique({ where: { name: input.name } });
        await tx.shippedItem.create({
          data: {
            serviceCenterId: id,
            itemId: item ? item.id : null,
            name: input.name,
            price: input.price,
            count: input.count,
          },
        });
      }

      return tx.serviceCenter.findUnique({
        where: { id },
        include: { items: true },
      }) as any;
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const branch = await tx.serviceCenter.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!branch) {
        throw new NotFoundException(`Service Center with ID ${id} not found`);
      }

      // Return stock for all shipped items
      for (const si of branch.items || []) {
        const item = await tx.item.findUnique({ where: { name: si.name } });
        if (item) {
          await tx.item.update({
            where: { id: item.id },
            data: { count: item.count + si.count },
          });
        }
      }

      // Cascade delete is handled by database relation cascading (Prisma schema relations onDelete: Cascade)
      await tx.serviceCenter.delete({
        where: { id },
      });
    });
  }
}
