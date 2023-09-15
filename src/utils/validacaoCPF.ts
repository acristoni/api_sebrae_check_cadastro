export class ValidacaoCpf {
  validar(cpf: string): boolean {
    cpf = cpf.replace(/[.-]/g, '');

    if (cpf.length !== 11) {
      return false;
    }

    // Verifique se todos os dígitos são iguais (CPF inválido, mas válido numericamente)
    const isAllDigitsEqual = /^(.)\1*$/.test(cpf);
    if (isAllDigitsEqual) {
      return false;
    }

    // Calcule o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const firstDigit = remainder >= 10 ? 0 : remainder;

    // Calcule o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const secondDigit = remainder >= 10 ? 0 : remainder;

    // Verifique se os dígitos verificadores estão corretos
    if (
      parseInt(cpf.charAt(9)) !== firstDigit ||
      parseInt(cpf.charAt(10)) !== secondDigit
    ) {
      return false;
    }

    return true;
  }
}
