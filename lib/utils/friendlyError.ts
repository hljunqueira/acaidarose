/**
 * Utilitário de sanitização de mensagens de erro para PT-PT amigável
 * Evita vazamento de strings técnicas brutas do PostgreSQL ou do sistema operacional
 */
export function formatFriendlyErrorMessage(raw: any): string {
  if (!raw) return 'Ocorreu um erro inesperado no sistema. Por favor, tente novamente.'
  const str = typeof raw === 'string' ? raw : (raw.message || String(raw))

  // Conflito de Chave Única (ex: email duplicado)
  if (
    str.includes('duplicate key value') ||
    str.includes('violates unique constraint') ||
    str.includes('users_email_key') ||
    str.includes('23505')
  ) {
    if (str.includes('users_email_key') || str.toLowerCase().includes('email')) {
      return 'Este endereço de email já se encontra registado no sistema. Por favor, utilize outro email ou edite o utilizador existente.'
    }
    return 'Já existe um registo idêntico no sistema com estes dados. Por favor, verifique os campos preenchidos.'
  }

  // Violação de Chave Estrangeira / Integridade Referencial
  if (
    str.includes('violates foreign key constraint') ||
    str.includes('is still referenced from table') ||
    str.includes('23503')
  ) {
    return 'Não é possível concluir esta operação porque existem outros registos ou pedidos vinculados a este item.'
  }

  // Erro de Sintaxe de UUID / Tipo de Dado
  if (
    str.includes('invalid input syntax for type uuid') ||
    str.includes('invalid input syntax') ||
    str.includes('22P02')
  ) {
    return 'Os dados fornecidos contêm um formato inválido. Por favor, verifique as informações preenchidas.'
  }

  // Falha de Conexão com Banco de Dados
  if (
    str.includes('ECONNREFUSED') ||
    str.includes('connection refused') ||
    str.includes('terminating connection') ||
    str.includes('57P01')
  ) {
    return 'Falha temporária de comunicação com a base de dados. Por favor, tente novamente dentro de instantes.'
  }

  return str
}
