import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'process';
import { WebHookModule } from './webhook/webhook.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'gmC24354.',
      database: 'postgres',
      entities: [],
      synchronize: true,
    }),
    WebHookModule,
  ],
})
export class AppModule {}
