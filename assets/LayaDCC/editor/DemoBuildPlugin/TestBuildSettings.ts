@IEditor.panel("MyTestBuildSettings", { usage: "build-settings", title: "热更新" })
export class TestBuildSettings extends IEditor.EditorPanel {
    @IEditor.onLoad
    static start() {
        Editor.typeRegistry.addTypes([
            {
                name: "TestBuildSettings",
                catalogBarStyle : "hidden",
                properties: [
                    {
                        name: "enabled",
                        type: "boolean",
                        default: false
                    },
                ]
            }
        ]);
        Editor.extensionManager.createSettings("TestBuildSettings", "project");
    }

    async create() {
        let panel = IEditor.GUIUtils.createInspectorPanel();
        panel.allowUndo = true;
        panel.inspect(Editor.getSettings("TestBuildSettings").data, "TestBuildSettings");
        this._panel = panel;
    }
}