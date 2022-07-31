import { Controller, Get, Query } from "@nestjs/common";
import { UseResult } from "src/config/hooks/useResult";
import { UserService } from "./user.service";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/userActive')
  getUserActive(@Query('account')account: string): Promise<UseResult>{
    console.log('userActive')
    return this.userService.userActive(account)
  }

  @Get('/readonlyUserList')
  getReadonlyUserList(@Query('account')account: string): Promise<UseResult>{
    console.log("readonlyUserList")
    return this.userService.readonlyUserList(account);
  }

  @Get('/link')
  getLink(@Query('account')account: string): Promise<UseResult>{
    console.log("link")
    return this.userService.generateLink(account);
  }

  @Get('/isLink')
  getIsReferralLink(@Query('link')link: string): Promise<UseResult>{
    console.log("isLink")
    return this.userService.isReferralLink(link);
  }
  
}
