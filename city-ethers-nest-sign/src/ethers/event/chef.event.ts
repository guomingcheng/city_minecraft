import { Injectable } from '@nestjs/common';
import { utils } from "ethers"

@Injectable()
export class MasterChefEvent{

    async DepositEvent (address: any, pid:any, amount:any){
        console.log("质押的用户: " + address)
        console.log("池子: " + utils.formatEther(pid))
        console.log("质押的数量：" + utils.formatEther(amount))
      }
    
    async WithdrawEvent(address: any, pid: any, amount: any){
        console.log("质押的用户: " + address)
        console.log("池子: " + utils.formatEther(pid))
        console.log("质押的数量：" + utils.formatEther(amount))
    }

}