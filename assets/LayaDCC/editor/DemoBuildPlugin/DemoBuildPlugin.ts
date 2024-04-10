
@IEditorEnv.regBuildPlugin("*")
export class TestBuildPlugin implements IEditorEnv.IBuildPlugin {
    config: IEditorEnv.ISettings;

    async onSetup(task: IEditorEnv.IBuildTask): Promise<void> {
        this.config = EditorEnv.getSettings("TestBuildSettings");
        await this.config.sync();

        if (this.config.data.enabled) //取消掉原来的版本管理
            task.config.enableVersion = false;
    }

    async onAfterExportAssets(task: IEditorEnv.IBuildTask) {
        if (!this.config.data.enabled)
            return;

        await IEditorEnv.utils.runTasks(task.exports.files, 5, async ([file, fileInfo]) => {
            if (fileInfo.noFile)
                return;

            let fullPath = IEditorEnv.utils.joinPaths(task.resourcePath, file);
            let hash = await IEditorEnv.utils.createFileHash(fullPath);
            console.log(hash);
        });
    }
}