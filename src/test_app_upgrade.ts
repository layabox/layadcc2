/**
 * DCC app upgrade detection test
 * Tests the conch branch logic in LayaDCCClient.init()
 * Uses mock conch + real DCCClientFS_native for file I/O
 * Server writes are simulated directly (unchanged code path)
 * Run: npx tsx src/test_app_upgrade.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LayaDCC, Params } from '../assets/LayaDCC/common/LayaDCC';
import { RootDesc } from '../assets/LayaDCC/common/RootDesc';
import { Env } from '../assets/LayaDCC/common/Env';

const testDir = path.join(os.tmpdir(), 'dcc-upgrade-' + Date.now());
const resDir = path.join(testDir, 'res');
const dccOut = path.join(testDir, 'dccout');
const cacheDir = path.join(testDir, 'cache');
const appDir = path.join(testDir, 'app');

for (const d of [resDir, dccOut, cacheDir, path.join(appDir, 'cache/dcc2.0')])
    fs.mkdirSync(d, { recursive: true });

// Mock conch
(globalThis as any).window = globalThis;
(globalThis as any).conch = {
    getCachePath: () => cacheDir,
    readFileFromAsset: (file: string, encode: string) => {
        const fp = path.join(appDir, file);
        if (!fs.existsSync(fp)) throw new Error('no asset: ' + file);
        const buf = fs.readFileSync(fp);
        if (encode === 'utf8') return buf.toString('utf8');
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
};
(globalThis as any).ZipFile = function() {};
(globalThis as any)._XMLHttpRequest = function() {};
(globalThis as any).fs_exists = (f: string) => fs.existsSync(f);
(globalThis as any).fs_mkdir = (f: string) => { fs.mkdirSync(f, { recursive: true }); return true; };
(globalThis as any).fs_readFileSync = (f: string) => { const b = fs.readFileSync(f); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
(globalThis as any).fs_writeFileSync = (f: string, d: any) => { if (d instanceof ArrayBuffer) d = Buffer.from(d); fs.writeFileSync(f, d); return true; };
(globalThis as any).fs_rm = (f: string) => { try { fs.unlinkSync(f); return true; } catch { return false; } };
(globalThis as any).fs_readdirSync = (f: string) => fs.readdirSync(f);
(globalThis as any).decodeBuffer = (buf: ArrayBuffer) => new TextDecoder().decode(buf);

const { DCCClientFS_native } = await import('../assets/LayaDCC/common/DCCClientFS_native');

let passed = 0, failed = 0;
function verify(c: boolean, d: string) {
    if (c) { passed++; console.log('  OK: ' + d); }
    else { failed++; console.log('  FAIL: ' + d); }
}

async function genHead(ver: string, content: Record<string, string>): Promise<string> {
    for (const [n, d] of Object.entries(content)) {
        const fp = path.join(resDir, n);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, d);
    }
    const dcc = new LayaDCC(); const p = new Params();
    p.version = ver; p.dccout = dccOut; dcc.params = p;
    await dcc.genDCC(resDir);
    return fs.readFileSync(path.join(dccOut, 'head.json'), 'utf8');
}

function setAppHead(h: string) { fs.writeFileSync(path.join(appDir, 'cache/dcc2.0/head.json'), h); }
function clearCache() { fs.rmSync(cacheDir, { recursive: true, force: true }); fs.mkdirSync(cacheDir, { recursive: true }); }
function readCachedHead(): RootDesc | null {
    try { const p = path.join(cacheDir, 'head.json');
        if (!fs.existsSync(p)) return null;
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { return null; }
}

/**
 * Simulate one app launch:
 * 1. Run the conch branch (our changed code) using real DCCClientFS_native
 * 2. If serverHead provided, write it to cache (simulates server response)
 */
async function simulateLaunch(serverHead: string | null) {
    const frw = new DCCClientFS_native();
    await frw.init(null, cacheDir);

    // Run conch branch (mirrors LayaDCCClient.init lines 140-165)
    const dccPath = 'cache/dcc2.0';
    try {
        const appData = (globalThis as any).conch.readFileFromAsset(dccPath + '/head.json', 'buffer') as ArrayBuffer;
        if (appData) {
            const appHeadStr = Env.dcodeUtf8(appData);
            const appObj = JSON.parse(appHeadStr) as RootDesc;
            const appRoot = appObj.root;
            let lastRoot: string | null = null;
            try { lastRoot = await frw.read('app_head_root', 'utf8', true, null) as string; } catch {}
            if (appRoot !== lastRoot) {
                console.log('    [conch] upgrade/first install');
                await frw.write('head.json', appData, true);
                await frw.write('app_head_root', appRoot, true);
            } else {
                console.log('    [conch] normal restart');
            }
        }
    } catch { console.log('    [conch] no head in pkg'); }

    // Simulate server writing remote head to cache
    if (serverHead) {
        console.log('    [server] remote head -> cache');
        await frw.write('head.json', serverHead, true);
    }
}

try {
    console.log('=== Generating resources ===');
    const h1 = await genHead('1.0.0', { 'hello.txt': 'v1', 'cfg.json': '{v:1}' });
    const r1 = (JSON.parse(h1) as RootDesc).root;
    console.log('v1: ' + r1.substring(0,12) + ' (app pkg)');
    const h2 = await genHead('2.0.0', { 'hello.txt': 'v2', 'cfg.json': '{v:2}' });
    const r2 = (JSON.parse(h2) as RootDesc).root;
    console.log('v2: ' + r2.substring(0,12) + ' (DCC hotfix)');
    const h3 = await genHead('3.0.0', { 'hello.txt': 'v3', 'cfg.json': '{v:3}', 'new.txt': 'x' });
    const r3 = (JSON.parse(h3) as RootDesc).root;
    console.log('v3: ' + r3.substring(0,12) + ' (app upgrade)');
    const h4 = await genHead('4.0.0', { 'hello.txt': 'v4', 'cfg.json': '{v:4}', 'new.txt': 'y' });
    const r4 = (JSON.parse(h4) as RootDesc).root;
    console.log('v4: ' + r4.substring(0,12) + ' (hotfix after upgrade)');

    console.log('--- Scene 1: First install (pkg=v1, server=v1) ---');
    clearCache(); setAppHead(h1);
    await simulateLaunch(h1);
    verify(readCachedHead()?.root === r1, 'cache = v1');

    console.log('--- Scene 2: DCC hot update (server=v2) ---');
    await simulateLaunch(h2);
    verify(readCachedHead()?.root === r2, 'cache = v2');

    console.log('--- Scene 3: Server OFF, restart (pkg=v1) ---');
    await simulateLaunch(null);
    verify(readCachedHead()?.root === r2, '[KEY] cache stays v2 (not overwritten by pkg v1)');

    console.log('--- Scene 4: App upgrade (pkg=v3), server OFF ---');
    setAppHead(h3);
    await simulateLaunch(null);
    verify(readCachedHead()?.root === r3, '[KEY] cache = v3 (app upgrade overwrites)');

    console.log('--- Scene 5: Server ON, hot update to v4 ---');
    await simulateLaunch(h4);
    verify(readCachedHead()?.root === r4, 'cache = v4');

    console.log('--- Scene 6: Server OFF again (pkg=v3) ---');
    await simulateLaunch(null);
    verify(readCachedHead()?.root === r4, '[KEY] cache stays v4 (not overwritten by pkg v3)');

    console.log('========================================');
    console.log('Total: ' + (passed+failed) + ', Passed: ' + passed + ', Failed: ' + failed);
    console.log(failed > 0 ? 'FAILED' : 'ALL PASSED');
} finally {
    fs.rmSync(testDir, { recursive: true, force: true });
    process.exit(failed > 0 ? 1 : 0);
}
