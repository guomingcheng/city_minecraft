import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers, utils } from 'ethers';
import { URL_LINK } from 'src/config/constants';
import { UseResult } from 'src/config/hooks/useResult';
import { User } from 'src/surface/user.enity';
import { UserStatus } from 'src/surface/userStatus.enity';
import { DataSource, Repository } from 'typeorm';


@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(UserStatus) private usersStatusRepository: Repository<UserStatus>,
    private dataSource: DataSource){}


  /**
   * 校验推荐 ID 是否是一个有效的
   * 外部调用
   **/
  async isReferralLink(_link: string): Promise<UseResult>{

    console.log(_link)
    try{
      let userStatusAll = await this.usersStatusRepository.findBy({defaultReferralLink: _link});
      console.log(userStatusAll)
      if(userStatusAll.length > 0){
        return UseResult.success(true)
      }else{
        return UseResult.success(false)
      }
    }catch(error){
      return UseResult.fail('UserService: internal error')
    }
  }

  /**
    * 获取 account 地址的推荐列表
    * 外部调用
    **/
  async readonlyUserList(_account: string): Promise<UseResult>{

    if(!utils.isAddress(_account)) return UseResult.fail('UserService: account Is not a valid address')
    try{

      let inviterUserList = await this.usersRepository.findBy({inviter: _account})
      return UseResult.success(inviterUserList)
    }catch(error){

      return UseResult.fail('UserService: internal error')
    }
  }

  /**
   * 绑定用户的推荐关系
   * 验证调用
   **/
  async bindingInviter(_account: string, _inviter: string, _inviterLink): Promise<UseResult>{

    if(!utils.isAddress(_account)) return UseResult.fail('UserService: account Is not a valid address')
    //if(!utils.isAddress(_inviter)) return UseResult.fail('UserService: inviter Is not a valid address')

    const useResult = await this.dataSource.transaction(async (manager) => {

      let userAll = await manager.findBy(User, {address: _account})
      let inviterAll = await manager.findBy(UserStatus , {defaultReferralLink: _inviterLink})
      let user: User;
      let inviter: UserStatus;

      try{

        if(inviterAll.length === 0){
          return UseResult.fail('UserService: recommender does not exist')
        }else{
          inviter = inviterAll[0];
          inviter.statsUsers = inviter.statsUsers + 1;
        }

        if(userAll.length === 0){
          user = User.newUser(_account, true, inviter.address, _inviterLink);
          await manager.save(User, user);
        }else{
          user = userAll[0]
          if(user.active === false){
            user.inviter = inviter.address;
            user.inviterLink = _inviterLink;
            await manager.update(User, {address: _account}, user)
          }else{
            return UseResult.fail('UserService: Not a new user')
          }
        }
        await manager.update(UserStatus, {address: inviter.address}, inviter)
        return UseResult.success({})
      }catch(error){
        console.log(error)
        return UseResult.fail('UserService: internal error')
      }
    })

    return useResult;
  
  }

  /**
   * 获取用户是否第一次使用产品
   * 外部调用
   **/
  async userActive(account: string): Promise<UseResult>{
    if(!utils.isAddress(account)) return UseResult.fail('UserService: account Is not a valid address')

    try{
      let userAll =  await this.usersRepository.findBy({address: account})
      if(userAll.length === 0){
        return UseResult.success(false)
      }else{
        let user = userAll[0]
        return UseResult.success(user.active)
      }
    }catch(error){
      return UseResult.fail('UserService: internal error')
      console.log(error)
    }
  }

  /**
   * 获取用户的推荐链接
   * 外部调用
   * */
  async generateLink(account: string): Promise<UseResult>{
    console.log(account)
    if(!utils.isAddress(account)) return UseResult.fail('UserService: account Is not a valid address')

    console.log(' if(utils.isAddress(account)) return')
    try{
      let userStatusAll = await this.usersStatusRepository.findBy({address: account})
      let userStatus: UserStatus;
      if(userStatusAll.length === 0){
        userStatus = new UserStatus(account);
        await this.usersStatusRepository.save(userStatus)
        return UseResult.success({link:`${URL_LINK}${userStatus.defaultReferralLink}`})
      }else{
        userStatus = userStatusAll[0];
        return UseResult.success({link:`${URL_LINK}${userStatus.defaultReferralLink}`})
      }
    }catch(error){
      return UseResult.fail('UserService: internal error')
      console.log(error)
    }
  }

  /**
   * 当用户质押提取 soul 收益时就会回调这个函数
   * 内部调用
   * */
  async actionPool(from: string| null, to: string|null, amount: any): Promise<void>{

    if(!from || !to ) return

    await this.dataSource.transaction(async (manager) => {

      let user = await manager.findBy( User, {address: to});
      let userTo: User;
      if(user.length === 0){
        userTo = new User(to , true);  // 构建一条记录, 设置为 true, 记录用户已经使用过公司的产品
        userTo.pool = JSON.stringify({soul: String(amount), usdt:''})
        userTo.inviter = '0x05258a3c3c9790e087056411f7A0f4c5B3F5129C'
        await manager.save(userTo);
      }else{
        userTo = user[0];

        let pool = JSON.parse(userTo.pool);
        userTo.pool = JSON.stringify({
              soul: ethers.BigNumber.from(pool.soul).add(amount).toString(),
              usdt: pool.usdt
        })

        if(userTo.inviter === null){    // 如果等于 null, 就表示这个用户并没有推荐人
          await manager.update(User, {address: userTo.address}, userTo)
        }else{
            // 到这里是表示这个用户是有推荐人的，需要给他的推荐人计算收益, 并使用事务写入
            console.log( userTo.inviter)

            let userStatusAll = await manager.findBy( UserStatus , {address: userTo.inviter})
            let userStatus = userStatusAll[0];

            let defaultRefPercents = JSON.parse(userStatus.defaultRefPercents);
            let poolPercents = defaultRefPercents.pool;
            if(poolPercents === 0){
              poolPercents = defaultRefPercents.default;
            }
            // 计算收益
            let amountBig = ethers.BigNumber.from(amount);
            let profit = amountBig.mul(poolPercents).div(100)
            userStatus.statsEarnedPool = profit.add(userStatus.statsEarnedPool).toString()

            await manager.update(UserStatus, {address: userStatus.address}, userStatus)
            await manager.update(
              User, 
              {address: userTo.address}, userTo
            )
        }
      }
    })
  }

  /**
   * 当用户在 NFT 市场购买时， 就会回调这个函数
   * 内部调用
   * */
  async actionMarket(from: string| null, to: string|null, amount: any): Promise<void>{

  }
}
