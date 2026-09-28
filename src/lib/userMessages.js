function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function errorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
}

export function errorIncludes(error, ...phrases) {
  const message = normalize(errorText(error))
  return phrases.some((phrase) => message.includes(normalize(phrase)))
}

export function friendlyErrorMessage(error, fallback) {
  if (errorIncludes(error, 'authentication required', 'sua sessao expirou')) {
    return 'Sua sessão expirou. Entre novamente para continuar.'
  }
  if (errorIncludes(error, 'user already belongs', 'already belongs to an organization', 'ja esta vinculada a uma empresa')) {
    return 'Esta conta já está vinculada a uma empresa.'
  }
  if (errorIncludes(error, 'permission denied', 'row-level security', 'not allowed', 'permissao insuficiente')) {
    return 'Seu perfil não tem permissão para realizar esta ação. Fale com um administrador da empresa.'
  }
  if (errorIncludes(error, 'failed to fetch', 'fetcherror', 'networkerror', 'load failed', 'erro de rede')) {
    return 'Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.'
  }
  if (errorIncludes(error, 'invalid input syntax', 'violates check constraint', 'violates foreign key constraint')) {
    return 'Confira os dados informados e tente novamente.'
  }
  return fallback
}

export function authErrorMessage(error, mode) {
  if (errorIncludes(error, 'invalid login credentials', 'invalid_credentials')) {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.'
  }
  if (errorIncludes(error, 'email not confirmed')) {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.'
  }
  if (errorIncludes(error, 'user already registered', 'already been registered', 'user exists')) {
    return 'Já existe uma conta com este e-mail. Entre com ela ou use outro endereço.'
  }
  if (errorIncludes(error, 'password should be at least', 'password must be at least', 'password is too short')) {
    return 'A senha precisa ter pelo menos 8 caracteres.'
  }
  if (errorIncludes(error, 'email address is invalid', 'invalid email', 'email is invalid', 'unable to validate email address')) {
    return 'Informe um endereço de e-mail válido.'
  }
  if (errorIncludes(error, 'signups not allowed', 'signup is disabled')) {
    return 'O cadastro de novas contas não está habilitado. Fale com o administrador.'
  }
  if (errorIncludes(error, 'email rate limit exceeded', 'rate limit exceeded', 'too many requests')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  }

  const fallback = mode === 'signup'
    ? 'Não foi possível criar sua conta agora. Confira os dados e tente novamente.'
    : 'Não foi possível entrar na sua conta. Confira seus dados e tente novamente.'
  return friendlyErrorMessage(error, fallback)
}
