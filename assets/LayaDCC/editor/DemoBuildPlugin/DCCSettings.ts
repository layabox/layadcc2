@IEditor.panel("DCCSettings", { usage: "build-settings", title: "DCC" })
export class DCCSettings extends IEditor.EditorPanel {
    @IEditor.onLoad
    static start() {
        Editor.typeRegistry.addTypes([
            {
                name: "DCCSettings",
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
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        //type: "string",
                        default: Editor.projectPath+'/release/web/',
                        hidden: "!data.enable",
                    },
                    {
                        name: "OutputPath",
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        default: Editor.projectPath+'/release/web/dccout',
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
        Editor.extensionManager.createSettings("DCCSettings", "project");
    }

    async create() {
        let panel = IEditor.GUIUtils.createInspectorPanel();
        panel.allowUndo = true;
        panel.inspect(Editor.getSettings("DCCSettings").data, "DCCSettings");
        this._panel = panel;
    }
}