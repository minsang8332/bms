import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { HealthModule } from '@/modules/health/health.module';
import { ItemsModule } from '@/modules/items/items.module';
import { ServiceCenterModule } from '@/modules/service-center/service-center.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    ItemsModule,
    ServiceCenterModule,
  ],
})
export class AppModule {}


