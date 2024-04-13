
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
}