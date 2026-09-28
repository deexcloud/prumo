export async function createDemoRequest(email) {
  const { supabase } = await import('./supabase')

  if (!supabase) {
    return {
      ok: false,
      message: 'Conecte o projeto Supabase para ativar o formulário de demonstração.',
    }
  }

  const { error } = await supabase
    .from('demo_requests')
    .insert({ email: email.trim().toLowerCase() })

  if (error) {
    return { ok: false, message: 'Não foi possível enviar agora. Tente novamente em instantes.' }
  }

  return { ok: true, message: 'Pedido enviado! Em breve entraremos em contato.' }
}
