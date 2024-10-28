import { getDiff } from './LayaDCC.js';
import { LayaDCCReader } from './LayaDCCReader.js';
export class DccDiffer {
    static async getDiffByRev(rev1, rev2) {
    }
    static async getDiff(head1, head2) {
        let dcc1 = new LayaDCCReader();
        let dcc2 = new LayaDCCReader();
        await dcc1.init(head1);
        await dcc2.init(head2);
        return getDiff(dcc1.gitfs, dcc2.gitfs);
    }
}
