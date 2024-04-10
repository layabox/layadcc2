import  {gzip,gunzip} from "zlib"

// 对象打包
// 为了cdn，本身也是一个对象
export class ObjectPackage{
    add(objid:string){
        //读文件内容，保存到buffer
        return this;
    }
    zip(){
        //把buffer打包成gzip
    }
    get(hash:string){

    }
    save(){

    }

    /**
     * 把包objid解开。
     * 在native的时候，为了方便需要解开
     * @param objid 
     */
    unpack(objid:string){

    }
    /**
     * 加载一个对象包
     * @param objid 
     */
    load(objid:string){
        //read
        //unzip
        //
    }
}