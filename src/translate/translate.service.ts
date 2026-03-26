import { Injectable } from '@nestjs/common';
import { ResponseDto } from './dto/response.dto';
import { ELanguage } from 'src/common/enums/role.enum';

@Injectable()
export class TranslateService {
  constructor() {}
  async translate(data: Record<any, any>): Promise<ResponseDto[]> {
    return [
      { data, lang: ELanguage.EN },
      { data, lang: ELanguage.FA },
    ];
  }
}
