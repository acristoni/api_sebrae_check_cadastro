import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { ValidacaoCpf } from './utils/validacaoCPF';

@Injectable()
export class AppService {
  public constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly validacaoCpf: ValidacaoCpf,
  ) {}

  access_token: string;

  getHello(): string {
    return 'Microsserviço em execução!';
  }

  async findByDocument(cpf: string): Promise<UserEntity> {
    try {
      return await this.userRepository.findOneOrFail({
        where: { document: cpf },
      });
    } catch (error) {
      return null;
    }
  }

  async updateUserSituation(id: string, situacao: boolean) {
    try {
      return await this.userRepository.update(id, {
        registrado_sebrae: situacao,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async createUser(cpf: string, situacao: boolean) {
    try {
      return await this.userRepository.insert({
        document: cpf,
        registrado_sebrae: situacao,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async validacao(cpfFromUser: string): Promise<string> {
    const cpf = cpfFromUser.replace(/[^0-9]/g, '');

    if (!this.validacaoCpf.validar(cpf)) {
      throw new HttpException(
        'CPF fora do padrão da Receita Federal',
        HttpStatus.BAD_REQUEST,
      );
    }

    let situacao = 'NÃO está cadastrado';

    if (this.access_token === undefined) {
      this.getToken();
    }

    const headersList = {
      'Content-Type': 'application/json',
      'API-TOKEN': this.access_token,
    };

    const reqOptions = {
      url: `https://api-chatbot.sebrae.com.br/v1/atendimento-sas/cliente?cpf=${cpf}`,
      method: 'POST',
      headers: headersList,
    };

    const response = await axios.request(reqOptions);
    console.log(response.data);
    if (
      response &&
      response.status === 200 &&
      response.data &&
      response.data.situacao &&
      response.data.situacao === 'CADASTRADO'
    ) {
      situacao = 'está cadastrado';
    }

    const user = await this.findByDocument(cpf);
    const estaCadastrado = situacao === 'está cadastrado';

    if (user) {
      this.updateUserSituation(user.id, estaCadastrado);
    } else {
      this.createUser(cpf, estaCadastrado);
    }

    return `Usuário com CPF ${cpf} ${situacao} no sistema do SEBRAE`;
  }

  async getToken() {
    // const url =
    //   'https://api-chatbot.sebrae.com.br/auth/realms/externo/protocol/openid-connect/token';
    const url = //ENDPOINT MOCKADO
      'https://private-anon-0f41b95908-registraratendimentossebrae.apiary-mock.com/auth/realms/externo/protocol/openid-connect/token';

    const formData = new URLSearchParams();
    // formData.append('username', 'groodme@groodme.com.br');
    // formData.append('password', "MkPg'be,}'&a3.{V");
    // formData.append('client_id', 'conecta');
    // formData.append('grant_type', 'password');

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    axios
      .post(url, formData.toString(), config)
      .then((response) => {
        console.log('Resposta:', response.data);
        if (response && response.data && response.data.access_token) {
          this.access_token = response.data.access_token;
        }
      })
      .catch((error) => {
        console.error('Erro:', error);
      });
  }
}
