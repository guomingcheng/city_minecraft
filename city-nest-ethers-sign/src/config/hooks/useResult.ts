
export class UseResult{

    data: any;
    statusCode: number;
    msg: string;

    static success(_data: any): UseResult{
        let result = new UseResult();
        result.statusCode = 200;
        result.msg = ''
        result.data = _data
        return result 
    }
 
    static fail(_msg: string): UseResult{
        let result = new UseResult();
        result.statusCode = 500;
        result.msg = _msg
        return result 
    }


}