import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  access_token: string;

  getHello(): string {
    return 'Microsserviço em execução!';
  }

  async validacao(cpf: string) {
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
    } else {
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
