import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError, AxiosResponse } from 'axios';
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

    const access_token = await this.getToken();

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + access_token,
    };

    const reqOptions = {
      url: `https://chatbot-gestao-backend.homolog.sebrae.com.br/v1/atendimento-sas/cliente?cpf=${cpf}`,
      method: 'GET',
      headers: headersList,
    };

    const response: AxiosResponse | void = await axios
      .request(reqOptions)
      .then((res) => res)
      .catch((err: AxiosError) => console.log('Error: ', err.message));

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
    const url =
      'https://amei.homolog.kubernetes.sebrae.com.br/auth/realms/externo/protocol/openid-connect/token';

    const formData = new URLSearchParams();
    formData.append('username', 'groodme@groodme.com.br');
    formData.append('password', "MkPg'be,}'&a3.{V");
    formData.append('client_id', 'conecta-sebrae');
    formData.append('grant_type', 'password');

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    return await axios
      .post(url, formData.toString(), config)
      .then((response) => {
        if (response && response.data && response.data.access_token) {
          return response.data.access_token;
        }
      })
      .catch((error: AxiosError) => {
        console.error('Erro:', error.message);
      });
  }

  async findAll(): Promise<UserEntity[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(cpfFromUser: string): Promise<boolean> {
    const cpf = cpfFromUser.replace(/[^0-9]/g, '');

    if (!this.validacaoCpf.validar(cpf)) {
      throw new HttpException(
        'CPF fora do padrão da Receita Federal',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { document: cpf },
    });

    if (!user) {
      throw new NotFoundException(
        'O CPF passado ainda não foi verificado junto ao SEBRAE, bata primeiro no end point "validacao"',
      );
    }

    return user.registrado_sebrae;
  }

  async ativacao(cpfFromUser: string): Promise<string> {
    const cpf = cpfFromUser.replace(/[^0-9]/g, '');

    if (!this.validacaoCpf.validar(cpf)) {
      throw new HttpException(
        'CPF fora do padrão da Receita Federal',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cpfParceiroSEBRAE = await this.findOne(cpf);

    if (cpfParceiroSEBRAE) {
      const access_token = await this.getToken();

      const headersList = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + access_token,
      };

      const bodyContent = JSON.stringify({
        tipo: 'REGISTRO_FERRAMENTA',
        dataHoraInicio: new Date(),
        cpfCliente: cpf,
        cnpjEmpreendimento: '21922069000142',
        codDisponibilizacao: '372001399',
        tipoRealizacao: 'SCN',
        codMomento: '15',
        descRealizacao: 'Ativação de cadastro',
      });

      const reqOptions = {
        url: 'https://chatbot-gestao-backend.homolog.sebrae.com.br/v1/atendimento-sas',
        method: 'POST',
        headers: headersList,
        data: bodyContent,
      };

      const response: AxiosResponse | void = await axios
        .request(reqOptions)
        .then((res) => res)
        .catch((err: AxiosError) => console.log('Error: ', err.message));

      if (response && response.status === 200) {
        return `Usuário com CPF ${cpf} teve a ativação de cadastro informada com sucesso para o SEBRAE`;
      } else {
        throw new InternalServerErrorException(
          'Houve um problema ao tentar informa a ativação de cadastro para o SEBRAE, tente novamente mais tarde ou entre em contato com o time de desenvolvimento',
        );
      }
    } else {
      throw new HttpException(
        'CPF não é de um parceiro SEBRAE',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async renovacao(cpfFromUser: string): Promise<string> {
    const cpf = cpfFromUser.replace(/[^0-9]/g, '');

    if (!this.validacaoCpf.validar(cpf)) {
      throw new HttpException(
        'CPF fora do padrão da Receita Federal',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cpfParceiroSEBRAE = await this.findOne(cpf);

    if (cpfParceiroSEBRAE) {
      const access_token = await this.getToken();

      const headersList = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + access_token,
      };

      const bodyContent = JSON.stringify({
        tipo: 'REGISTRO_FERRAMENTA',
        dataHoraInicio: new Date(),
        cpfCliente: cpf,
        cnpjEmpreendimento: '21922069000142',
        codDisponibilizacao: '372001399',
        tipoRealizacao: 'SCN',
        codMomento: '36',
        descRealizacao: 'Renovar serviço',
      });

      const reqOptions = {
        url: 'https://chatbot-gestao-backend.homolog.sebrae.com.br/v1/atendimento-sas',
        method: 'POST',
        headers: headersList,
        data: bodyContent,
      };

      const response: AxiosResponse | void = await axios
        .request(reqOptions)
        .then((res) => res)
        .catch((err: AxiosError) => console.log('Error: ', err.message));

      if (response && response.status === 200) {
        return `Usuário com CPF ${cpf} teve a renovação de serviço informada com sucesso para o SEBRAE`;
      } else {
        throw new InternalServerErrorException(
          'Houve um problema ao tentar informa a renovação de serviço para o SEBRAE, tente novamente mais tarde ou entre em contato com o time de desenvolvimento',
        );
      }
    } else {
      throw new HttpException(
        'CPF não é de um parceiro SEBRAE',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async integracao(cpfFromUser: string): Promise<string> {
    const cpf = cpfFromUser.replace(/[^0-9]/g, '');

    if (!this.validacaoCpf.validar(cpf)) {
      throw new HttpException(
        'CPF fora do padrão da Receita Federal',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cpfParceiroSEBRAE = await this.findOne(cpf);

    if (cpfParceiroSEBRAE) {
      const access_token = await this.getToken();

      const headersList = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + access_token,
      };

      const bodyContent = JSON.stringify({
        tipo: 'REGISTRO_FERRAMENTA',
        dataHoraInicio: new Date(),
        cpfCliente: cpf,
        cnpjEmpreendimento: '21922069000142',
        codDisponibilizacao: '372001399',
        tipoRealizacao: 'SCN',
        codMomento: '37',
        descRealizacao: 'Integrar com redes sociais',
      });

      const reqOptions = {
        url: 'https://chatbot-gestao-backend.homolog.sebrae.com.br/v1/atendimento-sas',
        method: 'POST',
        headers: headersList,
        data: bodyContent,
      };

      const response: AxiosResponse | void = await axios
        .request(reqOptions)
        .then((res) => res)
        .catch((err: AxiosError) => console.log('Error: ', err.message));

      if (response && response.status === 200) {
        return `Usuário com CPF ${cpf} teve a integração com redes sociais informada com sucesso para o SEBRAE`;
      } else {
        throw new InternalServerErrorException(
          'Houve um problema ao tentar informa a integração com redes sociais para o SEBRAE, tente novamente mais tarde ou entre em contato com o time de desenvolvimento',
        );
      }
    } else {
      throw new HttpException(
        'CPF não é de um parceiro SEBRAE',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
