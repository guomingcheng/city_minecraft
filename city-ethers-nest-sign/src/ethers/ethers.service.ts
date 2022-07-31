import { JsonRpcProvider } from '@ethersproject/providers';
import { Injectable } from '@nestjs/common';
import { match } from './cllas/match';
import { ethers, utils } from 'ethers';
import { MasterChef, SOULToken } from 'src/config/abi/types';
import { PRIVATE_KEY, REACT_APP_NODE_PRODUCTION } from 'src/config/constants';
import { useMasterCherContract, useSoulTokenContract } from 'src/config/hooks/useContract';
import { UseResult } from 'src/config/hooks/useResult';
import { DailyAccount } from 'src/surface/dailyAccount.entity';
import { UserStatus } from 'src/surface/userStatus.enity';
import { Action, SignatureRegisterDrawing } from 'src/types';
import { UserService } from 'src/user/user.service';
import { DataSource } from 'typeorm';
import { estimateGas } from './cllas/estimateGas';
import { MasterChefEvent } from './event/chef.event';
import { SoulTokenEvent } from './event/soul.event';

@Injectable()
export class EthersService {

  private library: JsonRpcProvider;
  private chef:MasterChef;
  private soul:SOULToken

  constructor( private readonly chefEvent: MasterChefEvent,
               private readonly soulEvent: SoulTokenEvent,
               private readonly userService: UserService,
               private dataSource: DataSource ){

     this.library = new ethers.providers.JsonRpcProvider(REACT_APP_NODE_PRODUCTION)
     
     this.chef = useMasterCherContract(this.library) as MasterChef
     this.soul = useSoulTokenContract(this.library) as SOULToken
     this.initEvent()
  }

  initEvent(){
    this.soul.connect(new ethers.Wallet(PRIVATE_KEY))
    this.chef.on("Deposit", this.chefEvent.DepositEvent);
    this.chef.on("Withdraw", this.chefEvent.WithdrawEvent);
    this.soul.on('Transfer',(
      form: string, 
      to: string, 
      amount: any
    ) => this.soulEvent.TransferEvent(this.userService, form, to, amount));

  }

  async safeTransferPool(signature: SignatureRegisterDrawing): Promise<UseResult>{

    let wallet = new ethers.Wallet(PRIVATE_KEY, this.library);
    let contractWithSigner = this.soul.connect(wallet);

    console.log(signature.type)
    if(utils.isAddress(signature.account)) return UseResult.fail('UserService: inviter Is not a valid address')
    if(signature.type !== `${Action.POOL}`) return UseResult.fail('EthersService: error in type')
    const useResult = await this.dataSource.transaction(async (manager) => {
 
       try{
        let userStatusAll = await manager.findBy(UserStatus, {address: signature.account})
        if(userStatusAll.length === 0) return UseResult.fail('EthersService: user does not exist')
        let userStatus = userStatusAll[0];

        let balance = ethers.BigNumber.from(userStatus.statsEarnedPool).sub(userStatus.balancePool);
        if(balance.gt(signature.amount)){

          userStatus.balancePool = ethers.BigNumber.from(userStatus.balancePool).add(signature.amount).toString()
          userStatus.lastDistributionAt = new Date()
          let dailyAccount = new DailyAccount(wallet.address, signature.account,signature.amount,signature.type)
          // 与执行
          const gasEstimation = await estimateGas(contractWithSigner, 'transfer',[ signature.account, signature.amount], 1000)
          dailyAccount.gas = gasEstimation.toString()

          await manager.update(UserStatus, {address: signature.account}, userStatus)
          await manager.save(DailyAccount, dailyAccount)
          
          // 执行转账
          await contractWithSigner.transfer(
            signature.account, 
            signature.amount, { gasLimit: gasEstimation.toString() }
          ).then(console.log)

          return UseResult.success(dailyAccount)
        }else{
          return UseResult.fail('EthersService: Too much withdrawal amount')
        }

       }catch(error){
        console.log(match(error.toString()))
        return UseResult.fail(match(error.toString()))
       }
    })
    return useResult;
  }
  
}
