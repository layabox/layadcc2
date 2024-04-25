
export class Env{
    static get runtimeName(){
        if((window as any).conch){
            return 'layaNative';
        }
        return 'web';
    }
    static isNative(){}
    static isWeb(){}
    static isNode(){}

    //根据不同的平台实现
    static dcodeUtf8(buf:ArrayBuffer){
        if(window.conch){
            //return conch.bufferToString(buf);
            let buff = new Laya.Byte(buf);
            let str = buff.readUTFBytes(buf.byteLength);
            return str;
        }else{
            return (new TextDecoder()).decode(buf);
        }
    }
}