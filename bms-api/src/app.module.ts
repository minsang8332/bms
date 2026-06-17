import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'bms-db',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.MYSQL_USER || 'bms_user',
      password: process.env.MYSQL_PASSWORD || 'bms_secure_password',
      database: process.env.MYSQL_DATABASE || 'bms',
      entities: [],
      synchronize: true, // Be careful in production, set to false
    }),
  ],
})
export class AppModule {}
