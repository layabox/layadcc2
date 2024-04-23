
export class AppResReader_Native{
    async getRes(file:string, encode:'utf8'|'buffer'){
        return conch.readFileFromAsset(file,encode)
    }
}