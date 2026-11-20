const { validar, calcularDigito, gerar, normalizar } = require('../src/utils/codigoRastreio');

describe('Código de rastreio (padrão S10)', () => {
  it.each([
    ['12345678', 5],
    ['00000001', 4],
    ['98765432', 6],
  ])('calcula o dígito verificador de %s = %i', (numero, dv) => {
    expect(calcularDigito(numero)).toBe(dv);
  });

  it('aplica as regras especiais de resto 0 e 1', () => {
    // soma % 11 === 0 → 5 | soma % 11 === 1 → 0
    expect(calcularDigito('00000000')).toBe(5);
    expect(calcularDigito('00004000')).toBe(0); // 4 * 3 = 12 → 12 % 11 = 1 → 0
  });

  it('valida código correto e extrai as partes', () => {
    expect(validar('AA123456785BR')).toEqual({
      valido: true,
      servico: 'AA',
      numero: '12345678',
      digito: 5,
      pais: 'BR',
    });
  });

  it('normaliza espaços e minúsculas', () => {
    expect(normalizar(' aa 123456785 br ')).toBe('AA123456785BR');
    expect(validar('aa123456785br').valido).toBe(true);
  });

  it('rejeita formato inválido', () => {
    expect(validar('123')).toMatchObject({
      valido: false,
      motivo: expect.stringMatching(/Formato/),
    });
  });

  it('rejeita dígito verificador errado', () => {
    expect(validar('AA123456789BR')).toEqual({
      valido: false,
      motivo: 'Dígito verificador inválido',
    });
  });

  it('gera códigos válidos', () => {
    expect(validar(gerar('47362915', 'QB')).valido).toBe(true);
  });
});
