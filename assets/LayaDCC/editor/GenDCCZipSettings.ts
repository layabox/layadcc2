
export class DCCZipSettings {
    @IEditor.onLoad
    static start() {
        Editor.typeRegistry.addTypes([
            {
                name: "DCCZipSettings",
                catalogBarStyle: "hidden",
                properties: [
                    {
                        name: "dcc1",
                        caption: '目录1',
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        type: "string",
                    },
                    {
                        name: "dcc2",
                        caption: '目录2',
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        type: "string",
                    },
                    {
                        name: "outputPath",
                        caption: "输出目录",
                        inspector: "File",
                        options: {
                            absolutePath: true,
                            properties: ["openDirectory"]
                        },
                        type: "string",
                    },
                    {
                        name: "outputFile",
                        caption: "输出文件",
                        type: "string",
                        default: 'dcc.zip'
                    },
                    {
                        name: "zipFile",
                        type: "string",
                        readonly: true,
                    },
                    {
                        name: "actions",
                        inspector: "Buttons",
                        options: { buttons: [{ caption: "生成", event: "click_gen" }] }
                    }

                ]
            }
        ]);
        Editor.extensionManager.createSettings("DCCZipSettings", "project");
    }
}