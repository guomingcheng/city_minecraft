import { Injectable } from "@nestjs/common";
import { CHANID } from "src/config/constants";
import { Action, actionAaddress, whiteAddress } from "src/types";
import { UserService } from "src/user/user.service";
import addresses from "src/config/constants/contracts";


@Injectable()
export class SoulTokenEvent{


    async TransferEvent(userService: UserService, form: string, to: string, amount: any){
        // 当 from 地址就是 masterChef 合约的时候
        if(form === addresses.masterChef[CHANID]){
            console.log("form 地址: " + form)
            console.log("to 地址: " + to)
            console.log("转账的数量：" + amount)
            console.log("======================================================================")
        }
        const FORM = form;
        if(whiteAddress[CHANID][FORM]){

            console.log("检测到白名单的地址。。。。。。。。，，，，，，，")
            const action = actionAaddress[CHANID][FORM];
            switch(action){
                case Action.POOL: userService.actionPool(form, to, amount)
                ;
            }

        }
    }
}