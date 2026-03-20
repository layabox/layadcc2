export class DCCConfig {
    static log = false;
}

export type DCCFileSource = 'package' | 'cache' | 'network' | 'indexdb' | 'unknown';

export function dccLog(msg: string) {
    if (DCCConfig.log) console.log('[DCC] ' + msg);
}
