/**
 * Validação de códigos de rastreio no padrão UPU S10, usado pelos Correios.
 * Formato: 2 letras (serviço) + 8 dígitos + dígito verificador + 2 letras (país). Ex.: AA123456785BR
 */
const S10_REGEX = /^([A-Z]{2})(\d{8})(\d)([A-Z]{2})$/;
const PESOS = [8, 6, 4, 2, 3, 5, 9, 7];

export function calcularDigito(numero: string): number {
  const soma = numero
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * PESOS[i], 0);
  const resto = soma % 11;
  if (resto === 0) return 5;
  if (resto === 1) return 0;
  return 11 - resto;
}

export const normalizar = (codigo: string | null | undefined) =>
  (codigo ?? '').trim().toUpperCase().replace(/\s+/g, '');

export type Validacao =
  | {
      valido: true;
      servico: string;
      numero: string;
      digito: number;
      pais: string;
    }
  | { valido: false; motivo: string };

export function validar(codigo: string): Validacao {
  const match = S10_REGEX.exec(normalizar(codigo));
  if (!match)
    return {
      valido: false,
      motivo: 'Formato inválido. Esperado: AA123456785BR',
    };

  const [, servico, numero, digito, pais] = match;
  if (calcularDigito(numero) !== Number(digito))
    return { valido: false, motivo: 'Dígito verificador inválido' };
  return { valido: true, servico, numero, digito: Number(digito), pais };
}

/** Gera um código válido a partir de 8 dígitos (útil em testes e exemplos). */
export const gerar = (numero: string, servico = 'AA', pais = 'BR') =>
  `${servico}${numero}${calcularDigito(numero)}${pais}`;
