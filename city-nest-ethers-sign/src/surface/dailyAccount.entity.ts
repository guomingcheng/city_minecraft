
import { Action, AithrawalState } from 'src/types';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 提取收益记录表  
 **/
@Entity()
export class DailyAccount{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    addressFrom: string

    @Column()
    addressTo: string;

    @Column()
    amount: string;

    @Column()
    action: Action;

    @Column()
    gas: string

    @Column({default: new Date})
    withdrawalTime: Date;

    @Column({default: AithrawalState.pending})
    withrawalState: AithrawalState;

    @Column({default: 'In execution'})
    msg: string

    constructor(_from: string, _to: string, _amount: string, _action: Action){
        this.addressFrom = _from;
        this.addressTo = _to;
        this.amount = _amount;
        this.action = _action;
    }

}