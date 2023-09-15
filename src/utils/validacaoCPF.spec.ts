import { ValidacaoCpf } from './validacaoCPF';

describe('Validação numero de CPF', () => {
  const validacaoCpfFornecido = new ValidacaoCpf();
  it('CPF válido, exemplo 82533502014, apenas números', () => {
    expect(validacaoCpfFornecido.validar('82533502014')).toBeTruthy();
  });
  it('CPF válido, exemplo 495.869.830-21, com ponto e hífen', () => {
    expect(validacaoCpfFornecido.validar('495.869.830-21')).toBeTruthy();
  });
  it('CPF Inválido', () => {
    expect(validacaoCpfFornecido.validar('82533502013')).toBeFalsy();
  });
});
