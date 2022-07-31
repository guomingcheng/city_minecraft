import { Module } from '@nestjs/common';
import { EthersModule } from 'src/ethers/ethers.module';
import { UserModule } from 'src/user/user.module';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';

@Module({
  imports: [UserModule, EthersModule],
  controllers: [SignatureController],
  providers: [SignatureService],
})
export class SignatureModule {}
