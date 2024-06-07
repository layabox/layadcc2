import {layadcctools} from './dist/layadcctools.js'

const {LayaDCCTools,LayaDCC,Params,PackRaw} = layadcctools;

let zipfile = await LayaDCCTools.genPackByFileList(
    [
    'D:/work/ideproj/DCCPlugin/release/web/internal/sky.jpg',
    ],
    'd:/temp/ddd1.pack', PackRaw);
