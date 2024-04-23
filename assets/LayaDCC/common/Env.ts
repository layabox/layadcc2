
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
        return (new TextDecoder()).decode(buf);
    }
}