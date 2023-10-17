import { Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@ApiTags('Verificação')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Apenas para teste de funcionamento do microsserviço',
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('validacao/:cpf')
  @ApiOperation({
    summary:
      'Verifica se pessoa possui vínculo com o SEBRAE e persiste em BD próprio.',
  })
  async validacao(@Param('cpf') cpf: string) {
    return await this.appService.validacao(cpf);
  }

  @Get('allusers')
  @ApiOperation({
    summary: 'Lista de todas as consultas já realizadas',
  })
  async findAll(): Promise<UserEntity[]> {
    return await this.appService.findAll();
  }

  @Get('find/:cpf')
  @ApiOperation({
    summary:
      'Busca um cpf no sistema e retorna se já está cadastrado e ativo com o SEBRAE',
  })
  async findOne(@Param('cpf') cpf: string): Promise<boolean> {
    return await this.appService.findOne(cpf);
  }

  @Post('ativacaodecadastro/:cpf')
  @ApiOperation({
    summary: 'Ativação de cadastro de usuário junto ao SEBRAE.',
  })
  async ativacao(@Param('cpf') cpf: string) {
    return await this.appService.ativacao(cpf);
  }

  @Post('renovarservico/:cpf')
  @ApiOperation({
    summary: 'Informa renovação de serviço de usuário para o SEBRAE.',
  })
  async renovacao(@Param('cpf') cpf: string) {
    return await this.appService.renovacao(cpf);
  }

  @Post('integrarredessociais/:cpf')
  @ApiOperation({
    summary: 'Informa integração com redes sociais de usuário junto ao SEBRAE.',
  })
  async integracao(@Param('cpf') cpf: string) {
    return await this.appService.integracao(cpf);
  }
}
