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
                        name: "enable",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "desc",
                        type: "string",
                        default: "dcc update",
                        tips:'本次版本描述',
                        hidden: "!data.enable",
                    },
                    {
                        name: "TargetPath",
                        type: "string",
                        default: Editor.projectPath+'/web/release/',
                        hidden: "!data.enable",
                    },
                    {
                        name: "OutputPath",
                        type: "string",
                        default: 'dccout',
                        hidden: "!data.enable",
                    },    
                    {
                        name: "OutputFile",
                        type: "string",
                        default: 'version',
                        hidden: "!data.enable",
                    },             
                    {
                        name: "version",
                        type: "string",
                        default: '1.0.0',
                        hidden: "!data.enable",
                    },                           
                    {
                        name: "ReserveOldAssets",
                        type: "boolean",
                        default: true,
                        hidden: "!data.enable",
                    },               
                    {
                        name: "FastMode",
                        type: "boolean",
                        default: true,
                        hidden: "!data.enable",
                    },                       
                    {
                        name: "mergeSmallFiles",
                        type: "boolean",
                        default: false,
                        hidden: "!data.enable",
                    },                
                    {
                        name: "MaxSmallFileSize",
                        caption:"Max small file size (K)",
                        addIndent: 1,
                        type: "number",
                        default: 100,
                        hidden: "!(data.mergeSmallFiles&&data.enable)",
                    },                
                    {
                        name: "MaxPackSize",
                        caption:"Max pack size (K)",
                        addIndent: 1,
                        type: "number",
                        default: 1000,
                        hidden: "!(data.mergeSmallFiles&&data.enable)",
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