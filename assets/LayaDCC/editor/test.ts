import { cwd } from "process";
import { LayaDCCCmd } from "../common";
import * as path from 'path';

export class testDCC{
    @IEditor.onLoad
    static init1(){
        console.log('xiiii')
    }

    @IEditor.menu('App/tool/LayaDCC')
    async testdcc(){
        let a = new LayaDCCCmd();
        a.dir = path.join(Editor.projectPath,'release/web');
        a.run();        
    }    
}