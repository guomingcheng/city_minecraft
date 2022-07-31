import { Controller, Get } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { EthersService } from './ethers.service';


@Controller("/ether")
export class EthersController {
  constructor(private readonly appService: EthersService
              ) {}


  @Get()
  getHello(): string {
    //console.log(this.userService)
    return "成功";
  }
}
