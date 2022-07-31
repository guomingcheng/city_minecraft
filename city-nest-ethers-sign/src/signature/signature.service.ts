import { Injectable } from '@nestjs/common';
import { recoverPersonalSignature } from 'eth-sig-util'
import { utils } from "ethers"
import { UseResult } from 'src/config/hooks/useResult';
import { SignatureRegisterDrawing } from 'src/types';

@Injectable()
export class SignatureService {

  async isRecovery(address: string, signature: string): Promise<UseResult>{

    const account:string = recoverPersonalSignature({
      data: JSON.stringify({'action': 'register', 'address': address}),
      sig: signature
    })
    if(account.toLowerCase() === address.toLowerCase()){
      return UseResult.success({})
    }else{
      return UseResult.fail(
        'Signature: Verification failed, malicious call'
      )
    }
  }

  async isRecoveryDrawing(signature: SignatureRegisterDrawing): Promise<UseResult>{
    if(utils.isAddress(signature.account)) return UseResult.fail('UserService: account Is not a valid address')
    if(signature.amount === '0') return UseResult.fail('UserService: Balance must be greater than 0')

    const account: string = recoverPersonalSignature({
      data: JSON.stringify(
        {'action': 'drawing', 'type': signature.type, 'address': signature.account, 'amount': signature.amount}
      ),
      sig: signature.sig
    })
    if(account !== signature.account){
      return UseResult.fail('Signature: Incorrect signature')
    }else{
      return UseResult.success(signature)
    }
  }
}
