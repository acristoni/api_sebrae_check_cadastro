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
}
