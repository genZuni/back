import { ELanguage } from "src/common/enums/role.enum"

export class ResponseDto{
    lang:ELanguage
    data:Record<any,any>
}