import { LayaDCCTools } from "../ExpTools/LayaDCCTools";
import * as fs from 'fs'

function delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export class GenDCCZipDialog extends IEditor.Dialog {
    static working = false;
    static loopTimer:any;
    async create() {
        //this.contentPane = await gui.UIPackage.createWidget("MyDialog.widget");
        let panel = IEditor.GUIUtils.createInspectorPanel();
        panel.allowUndo = true;
        let data = Editor.getSettings("DCCZipSettings").data;
        data.zipFile='';
        panel.inspect(data, 'DCCZipSettings');
        this.contentPane = panel;
        panel.on('click_gen', async () => { await this.onGenZip(); })
        panel.height = 170;
        this.title = '不同版本的DCC的Zip补丁生成器'
    }

    async onGenZip() {
        if (GenDCCZipDialog.working) {
            alert('上一个任务正在执行，请等待结束。')
            return;
        }
        if(GenDCCZipDialog.loopTimer){
            clearInterval(GenDCCZipDialog.loopTimer);
            GenDCCZipDialog.loopTimer=null;
        }
        //检查参数
        let data = Editor.getSettings("DCCZipSettings").data as any;
        data.zipFile='';
        if(!data.dcc1 || !fs.existsSync(data.dcc1)){
            alert('参数不对：需要设置目录1');
            return;
        }
        if(!data.dcc2||!fs.existsSync(data.dcc2)){
            alert('参数不对：需要设置目录2');
            return;
        }
        
        if(!data.outputPath){
            alert('参数不对：需要设置输出目录');
            return;
        }

        GenDCCZipDialog.working = true;
        await delay(1);
        data.zipFile='生成中';
        let prog=0;
        let loop =GenDCCZipDialog.loopTimer = setInterval(() => {
            data.zipFile = '生成中' + ''.padEnd(prog,'.');
            prog++;
            if(prog>10)prog=0;
        }, 500);
        let zipfile = await LayaDCCTools.genZipByComparePath(data.dcc1, data.dcc2, data.outputPath,data.outputFile);
        //await delay(12000)
        clearInterval(loop);
        data.zipFile = zipfile;
        GenDCCZipDialog.working = false;
    }

    onShown() {
    }

    onHide() {
    }
}