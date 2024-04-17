import { LayaDCCClient } from "./LayaDCCClient";

//可以更新的dcc客户端
export class UpdateableDCCClient extends LayaDCCClient{
    /**
     * 更新一个文件
     * @param file 相对路径
     * @param content 
     */
    async setFile(file:string, content:'utf8'|'buffer'){

    }

    /**
     * 更新完毕，计算hash等
     * 
     * @param modifyTm 设置更新时间，如果为空则不修改当前记录的时间。
     */
    async updateEnd(modifyTm:Date|null){

    }
    
}