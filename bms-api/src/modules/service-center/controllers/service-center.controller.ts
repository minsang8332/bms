import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ServiceCenterService } from '@/modules/service-center/services/service-center.service';
import { ServiceCenter } from '@prisma/client';


@Controller('service-center')
export class ServiceCenterController {
  constructor(private readonly serviceCenterService: ServiceCenterService) {}

  @Get('statuses')
  getStatuses(): string[] {
    return ['문의접수', '입고요청', '수리중', '수리완료', '출고대기', '출고완료', '접수취소'];
  }

  @Get()
  findAll(): Promise<ServiceCenter[]> {
    return this.serviceCenterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ServiceCenter> {
    return this.serviceCenterService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<ServiceCenter>): Promise<ServiceCenter> {
    return this.serviceCenterService.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<ServiceCenter>,
  ): Promise<ServiceCenter> {
    return this.serviceCenterService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<boolean> {
    try {
      await this.serviceCenterService.remove(id);
      return true;
    } catch {
      return false;
    }
  }
}
