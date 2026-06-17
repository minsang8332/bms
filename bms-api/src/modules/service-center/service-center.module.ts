import { Module } from '@nestjs/common';
import { ServiceCenterService } from '@/modules/service-center/services/service-center.service';
import { ServiceCenterController } from '@/modules/service-center/controllers/service-center.controller';


@Module({
  controllers: [ServiceCenterController],
  providers: [ServiceCenterService],
})
export class ServiceCenterModule {}
