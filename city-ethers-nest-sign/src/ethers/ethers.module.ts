import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyAccount } from 'src/surface/dailyAccount.entity';
import { UserStatus } from 'src/surface/userStatus.enity';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { EthersController } from './ethers.controller';
import { EthersService } from './ethers.service';
import { MasterChefEvent } from './event/chef.event';
import { SoulTokenEvent } from './event/soul.event';


@Module({
  imports: [UserModule,TypeOrmModule.forFeature([UserStatus, DailyAccount])],
  controllers: [EthersController],
  providers: [EthersService, MasterChefEvent, SoulTokenEvent],
  exports:[EthersService,TypeOrmModule]
})
export class EthersModule {}
