import { Module } from '@nestjs/common';
import { WebHookController } from './webhook.Controller';
import { WebHookService } from './webhook.service';

@Module({
  controllers: [WebHookController],
  providers: [WebHookService],
})
export class WebHookModule {}
