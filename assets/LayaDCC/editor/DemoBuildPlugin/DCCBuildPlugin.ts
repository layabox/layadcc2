import * as fs from 'fs';
import { LayaDCC, Params } from "../../common/LayaDCC";

@IEditorEnv.regBuildPlugin("android")
@IEditorEnv.regBuildPlugin("ios")
export class DCCBuildPlugin implements IEditorEnv.IBuildPlugin {
    config: IEditorEnv.ISettings;

    async onSetup(task: IEditorEnv.IBuildTask): Promise<void> {
        this.config = EditorEnv.getSettings("DCCSettings");
        await this.config.sync();

        if (this.config.data.enable) //取消掉原来的版本管理
            task.config.enableVersion = false;
    }

    async onAfterExportAssets(task: IEditorEnv.IBuildTask) {
        if (!this.config.data.enable)
            return;

        // await IEditorEnv.utils.runTasks(task.exports.files, 5, async ([file, fileInfo]) => {
        //     if (fileInfo.noFile)
        //         return;

        //     let fullPath = IEditorEnv.utils.joinPaths(task.resourcePath, file);
        //     let hash = await IEditorEnv.utils.createFileHash(fullPath);
        //     console.log(hash);
        // });
    }

    async onCreatePackage(task: IEditorEnv.IBuildTask): Promise<void> {
    }

    async onCreateManifest?(task: IEditorEnv.IBuildTask): Promise<void> {
    }

    /**
     * 
     * @param dir 构建目录，即resource所在目录,例如 xx/release/android/
     * @param platform 
     */
    async genDCCCache(dir: string, platform: "android" | "ios" | "windows") {
        let dcc = new LayaDCC();
        let param = new Params();
        dcc.params = param;
        //确定路径
        let cachePath = dir;
        if (platform == 'android') {
            //查找 android_studio 目录
            let dirs = fs.readdirSync(dir);
            for (let f of dirs) {
                if (f == 'resource') continue;
                let ccs = fs.readdirSync(`${dir}/${f}`);
                if (ccs.indexOf('android_studio') >= 0) {
                    cachePath = `${cachePath}/${f}/android_studio/app/src/main/assets`
                    break;
                }
            }
        } else if (platform == 'ios') {
            //DCCPlugin\ios\DCCPlugin\resource/cache
            //先查找包含 native.json的目录，通常也包含ios
            //在ios下找一个包含resource的目录，就是项目名称
            let dirs = fs.readdirSync(dir);
            for (let f of dirs) {
                if (f == 'resource') continue;
                let ccs = fs.readdirSync(`${dir}/${f}`);
                if (ccs.indexOf('ios') >= 0 && ccs.indexOf('native.json') > 0) {
                    cachePath = `${dir}/${f}/ios/${f}/resource/`
                    break;
                }
            }
        }
        if (cachePath == dir) {
            //没有找到
            throw '没有找到包含存放cache的目录'
        }

        param.dccout = cachePath + '/cache/dcc2.0/';
        await dcc.genDCC(dir + '/resource');
        console.log('完成，输出在:', param.dccout);
    }    

    async onEnd(task: IEditorEnv.IBuildTask): Promise<void> {
        if (!this.config.data.enable)
            return;

        let platform = task.platform;
        let platformParam: 'android' | 'ios' | 'windows';
        if (platform == 'android') platformParam = 'android';
        else if (platform == 'ios') platformParam = 'ios';
        else {
            return;
        }
        let dir = task.destPath;//xxx/relase/platform
        await this.genDCCCache(dir, platformParam)
    }
}