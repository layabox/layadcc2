export class testDCC{
    @IEditor.onLoad
    static init1(){
        console.log('xiiii')
    }

    @IEditor.menu('App/tool/LayaDCC')
    async testdcc(){
        console.log('kkk')
    }    
}