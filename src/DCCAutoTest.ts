import { DCCClientFS_NodeJS } from "../assets/LayaDCC/common/DCCClientFS_NodeJS";
import { DCCFS_NodeJS } from "../assets/LayaDCC/common/DCCFS_NodeJS";
import { LayaDCC, Params } from "../assets/LayaDCC/common/LayaDCC";
import { LayaDCCClient } from "../assets/LayaDCC/common/LayaDCCClient";

export class DCCAutoTest{
    static async run(){
        await test_nodePack_downloadOnce();
    }
}

//第二次不会再次下载节点包
async function test_nodePack_downloadOnce(){
    let testdir_ver1 = Editor.projectPath+'/dcctest/ver1'
    let dcc = new LayaDCC();
    let param = new Params();
    param.version = '1.0.0';
    dcc.params = param;
    param.dccout = Editor.projectPath+'/dcctest/dccout'
    await dcc.genDCC(testdir_ver1);


    let urlbase = `file:///${Editor.projectPath}/dcctest/dccout/`;
    let dccurl = `file:///${Editor.projectPath}/dcctest/dccout/`
    let headFile = `file:///${Editor.projectPath}/dcctest/dccout/version.1.0.0.json`

    //let localFS = new DCCClientFS_NodeJS(dccCache);
    let dcc1 = new LayaDCCClient(DCCClientFS_NodeJS,dccurl);
    dcc1.onlyTransUrl=false;
    dcc1.pathMapToDCC= urlbase;

    let initok = await dcc1.init(headFile);
    if(!initok)
        return false;

}