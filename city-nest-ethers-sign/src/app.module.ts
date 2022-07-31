import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthersModule } from './ethers/ethers.module';
import { SignatureModule } from './signature/signature.module';
import { DailyAccount } from './surface/dailyAccount.entity';
import { User } from './surface/user.enity';
import { UserStatus } from './surface/userStatus.enity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'gmC24354.',
      database: 'test',
      entities: [UserStatus, User, DailyAccount],
      synchronize: true,
    }),
    UserModule, SignatureModule, EthersModule],
})
export class AppModule {}
