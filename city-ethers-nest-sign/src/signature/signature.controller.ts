import { Body, Controller, Get, Post } from "@nestjs/common";
import { get } from "http";
import { UseResult } from "src/config/hooks/useResult";
import { EthersService } from "src/ethers/ethers.service";
import { Action, SignatureRegister, SignatureRegisterDrawing } from "src/types";
import { UserService } from "src/user/user.service";
import { SignatureService } from "./signature.service";

@Controller("/signature")
export class SignatureController {

  constructor(
    private readonly signaturService: SignatureService,
    private readonly userService: UserService,
    private readonly ethersService: EthersService
    ) {}

  @Post("/recovery")
  async setSignatureRegister(@Body() signature: SignatureRegister): Promise<UseResult>{

    console.log(signature.account)
    console.log(signature.readonly)
    console.log(signature.sig)
    let result = await this.signaturService.isRecovery(signature.account, signature.sig)
    /**
     * 如果恢复的地址不正确，那就表示这个是恶意调用，不需要对用户的地址做任何处理
     **/
    if(result.statusCode == 200){
        // 当验证成功，就绑定双方的关系
        return this.userService.bindingInviter(
          signature.account, 
          signature.readonly, 
          signature.inviterLink
        )
    }
    return result;
  }

  @Post("/recoveryDrawing")
  async setSignatureRegisterDrawing(@Body() signature: SignatureRegisterDrawing): Promise<UseResult>{
    
    let result = await this.signaturService.isRecoveryDrawing(signature)

    if(result.statusCode === 200){
      this.ethersService.safeTransferPool(result.data)
    }

    return result;
  }

  @Get('/get')
  getAmount(): Promise<UseResult>{
    //this.ethersService.safeTransfer('','')
    let drawing: SignatureRegisterDrawing = {
      account: '0x05258a3c3c9790e087056411f7A0f4c5B3F5129C',
      amount: '536200000',
      type: Action.POOL,
      sig: ''
    }

    return this.ethersService.safeTransferPool(drawing)
  }
}
