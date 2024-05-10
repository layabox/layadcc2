import { LayaDCCCmd } from "../../common";

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
        let cmd = new LayaDCCCmd();
        await cmd.genDCCCache(dir, platformParam)
    }
}