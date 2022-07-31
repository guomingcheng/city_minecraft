import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

const consumption = { soul:'', usdt: ''}

@Entity()
export class User{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    address: string;

    @Column({default: null})
    inviter: string | null;

    @Column({default: null})
    inviterLink: string | null;

    @Column({default: false})
    active: boolean;

    @Column({default: JSON.stringify(consumption) })
    pool: string;

    @Column({default: JSON.stringify(consumption) })
    farm: string;

    @Column({default: JSON.stringify(consumption) })
    swap: string;

    @Column({default: JSON.stringify(consumption) })
    market: string;

    @Column({default: JSON.stringify(consumption) })
    game: string;

    @Column({default: JSON.stringify(consumption) })
    other: string

    @Column({default: new Date})
    created_at: Date;

    @Column({default: new Date})
    lastDate: Date;

    constructor(_address: string, _active: boolean){
        this.address = _address;
        this.active = _active;
    }

    static newUser(_address: string, _active: boolean, _inviter: string, _inviterLink: string ): User{
        let user: User = new User(_address, _active);
        user.inviter = _inviter;
        user.inviterLink = _inviterLink;
        return user
    }
}