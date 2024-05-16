import { LayaDCCClient } from "./LayaDCCClient";

export { LayaDCCClient };

//conch
(async ()=>{
if(window.conch){
    let dcc = new LayaDCCClient('http://localhost:7788/' );
    //设置这个地址下的资源加载走DCC模式
    dcc.pathMapToDCC= 'http://localhost:8899/';
    //通过DCC的根文件初始化dcc客户端
    let initok = await dcc.init('http://localhost:7788/version.1.0.0.json',null);

    dcc.injectToNative3();
}
})();