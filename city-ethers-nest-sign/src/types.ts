
import addresses from './config/constants/contracts';

export enum ChainId {
    BSCSCAN = 56,
    BSCSCANTEST = 97,
}

export type SignatureLike  = {
    r: string;
    s?: string;
    _vs?: string,
    recoveryParam?: number;
    v?: number;
};

export type SignatureRegister = {
    account: string,
    readonly: string,
    sig: string,
    inviterLink: string
}

export type SignatureRegisterDrawing = {
    account: string,
    amount: string,
    sig: string,
    type: Action,
}

// 类型
export enum Action{

    POOL='pool',
    SWAP='swap',
    MARKET='market',
    GAME='game',
    OTHER='other'
}

export const actionAaddress:{ [chinId in ChainId]: {[key: string]: Action} } = {

    [ChainId.BSCSCAN]:{},
    [ChainId.BSCSCANTEST]:{
        [addresses.masterChef[ChainId.BSCSCANTEST]]: Action.POOL
    }
}

export const whiteAddress:{ [chinId in ChainId]: {[key: string]: boolean} } = {

    [ChainId.BSCSCAN]:{},
    [ChainId.BSCSCANTEST]:{
        [addresses.masterChef[ChainId.BSCSCANTEST]]: true
    }
}

export enum AithrawalState{

    pending= 2,    // 执行中
    rejected=0,    // 失败
    resloved=1,    // 成功
}

export type User = {
    id: string,
    account: string,
    status: boolean
}

export{}