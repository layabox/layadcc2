
export interface IResReader{
    getRes(file:string, encode:'utf8'|'buffer'):Promise<string|ArrayBuffer>;
}

export class AppResReader_Native implements IResReader{
    async getRes(file:string, encode:'utf8'|'buffer'){
        return conch.readFileFromAsset(file,encode)
    }
}