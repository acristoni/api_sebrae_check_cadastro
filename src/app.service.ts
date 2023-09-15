import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Microsserviço em execução!';
  }

  async validacao(cpf: string) {
    return cpf;
  }
}
