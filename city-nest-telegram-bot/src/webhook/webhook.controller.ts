import { Body, Controller, Post } from '@nestjs/common';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { TelegramBot } from 'src/telegram/TelegramBot';
import { WebHookService } from './webhook.service';

@Controller()
export class WebHookController {
  constructor(private webHookService: WebHookService) {}
  @Post()
  async webHook(@Body() telegramBot: any): Promise<string> {
    const payload = {
      chat_id: '1794294032',
      text: '测试成功',
    };
    const bot = new TelegramBot(
      '5476727522:AAHM9qY_V8VKxjuzRHPfvpY5nT9DDslEgKA',
    );
    console.log(payload);
    console.log(await bot.getMe());

    return '运行成功';
  }
}
