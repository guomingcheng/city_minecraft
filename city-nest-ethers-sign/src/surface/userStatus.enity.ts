import { randomUUID } from 'crypto';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 提成最高可达百分百
 *  
 **/
const defaultRefPercents = {default: 10,pool: 2,farm: 0,swap: 0,market: 0,game: 0,other: 0}
/**
 * @dev 推荐人的状态 
 * 
 **/
@Entity()
export class UserStatus {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column({default: '0'})
  statsEarnedPool: string;

  @Column({default: '0'})
  statsEarnedFarm: string;

  @Column({default: '0'})
  statsEarnedSwap: string;

  @Column({default: '0'})
  statsEarnedMarket: string;

  @Column({default: '0'})
  statsEarnedGame: string;

  @Column({default: '0'})
  statsEarnedOther: string;

  @Column({default: '0'})
  balancePool: string;

  @Column({default: '0'})
  balanceFarm: string;

  @Column({default: '0'})
  balanceSwap: string;

  @Column({default: '0'})
  balanceMarket: string;

  @Column({default: '0'})
  balanceGame: string;

  @Column({default: '0'})
  balanceOther: string;

  @Column({default: 0})
  statsUsers: number;

  @Column({default: 0})
  statsUsersPool: number;

  @Column({default: 0})
  statsUsersFarm: number;

  @Column({default: 0})
  statsUserSwap: number;

  @Column({default: 0})
  statsUsersMarket: number;

  @Column({default: 0})
  statsUsersOther: number;

  @Column({default: randomUUID()})
  defaultReferralLink: string;
  
  @Column({default: new Date})
  lastDistributionAt: Date;

  @Column({default: new Date})
  created_at: Date;

  @Column({default: JSON.stringify(defaultRefPercents) })
  defaultRefPercents: string

  constructor(_address: string){
    this.address = _address;
  }

}