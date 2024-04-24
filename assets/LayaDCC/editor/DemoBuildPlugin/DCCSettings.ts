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
                        caption:"开启",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "buildCache",
                        caption:"打包资源到native",
                        type: "boolean",
                        default: false,
                        hidden: "!data.enable",
                        tips:'是否把资源打包到native应用中',
                    },
                    {
                        name: "desc",
                        caption:"描述",
                        type: "string",
                        default: "dcc update",
                        tips:'本次版本描述',
                        hidden: "!data.enable",
                    },
                    {
                        name: "targetPath",
                        caption:'资源目录',
                        type: "string",
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        default: Editor.projectPath+'/release/web/',
                        hidden: "!data.enable",
                    },
                    {
                        name: "outputPath",
                        caption:"输出目录",
                        type: "string",
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        default: Editor.projectPath+'/release/web/dccout',
                        hidden: "!data.enable",
                    },    
                    {
                        name: "version",
                        caption:"版本",
                        type: "string",
                        default: '1.0.0',
                        hidden: "!data.enable",
                        tips:"指定资源版本，如果保留老的资源，则不同的版本可以共存",
                    },                           
                    // {
                    //     name: "reserveOldAssets",
                    //     caption:"保留老的资源",
                    //     type: "boolean",
                    //     default: true,
                    //     hidden: "!data.enable",
                    // },               
                    {
                        name: "fastMode",
                        caption:"快速模式",
                        type: "boolean",
                        default: true,
                        hidden: "!data.enable",
                        tips:"生成dcc的时候，会比较文件修改时间，时间没变则不再计算"
                    },               
                    /*        
                    {
                        name: "mergeSmallFiles",
                        caption:"合并小文件",
                        type: "boolean",
                        default: false,
                        hidden: "!data.enable",
                    },                
                    {
                        name: "maxSmallFileSize",
                        caption:"碎文件大小阈值(K)",
                        tips:"小于这个值的文件会被打包",
                        addIndent: 1,
                        type: "number",
                        default: 100,
                        hidden: "!(data.mergeSmallFiles&&data.enable)",
                    },                
                    {
                        name: "maxPackSize",
                        caption:"打包文件大小阈值(K)",
                        tips:"打包文件不会超过这个大小",
                        addIndent: 1,
                        type: "number",
                        default: 1000,
                        hidden: "!(data.mergeSmallFiles&&data.enable)",
                    },          
                    */      

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