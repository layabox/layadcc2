import { getDiff } from "./LayaDCC";
import { LayaDCCReader } from "./LayaDCCReader";

export class DccDiffer{
    static async getDiffByRev(rev1:number, rev2:number){

    }
    static async getDiff(head1:string, head2:string){
        let dcc1 = new LayaDCCReader();
        let dcc2 = new LayaDCCReader();

        await dcc1.init(head1);
        await dcc2.init(head2);
        return getDiff(dcc1.gitfs,dcc2.gitfs);
    }
}