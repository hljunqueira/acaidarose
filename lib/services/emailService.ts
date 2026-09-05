/**
 * Serviço de Envio de E-mails Transacionais via Resend API
 * Domínio Oficial Verificado: acaidarose.pt
 */

interface SendPasswordResetEmailParams {
  to: string
  code: string
  name?: string
}

export function renderMinimalistPasswordResetEmail(code: string, name?: string): string {
  const greeting = name ? `Olá, ${name}.` : 'Olá.'
  
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Acesso — Açaí da Rose</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0612; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0612; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #160F24; border: 1px solid #2A1E3D; border-radius: 24px; padding: 40px 28px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Logo Oficial Centralizado -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <img 
                src="https://acaidarose.pt/logo-oficial.png?v=2026" 
                alt="Açaí da Rose" 
                width="140" 
                style="display: block; width: 140px; max-width: 100%; height: auto; margin: 0 auto; border: 0;"
              />
            </td>
          </tr>

          <!-- Título & Identificação -->
          <tr>
            <td style="padding-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #C084FC; display: inline-block;">
                Portal da Equipa · Segurança
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0; letter-spacing: -0.02em;">
                Recuperação de Acesso
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 28px;">
              <p style="font-size: 13px; line-height: 1.6; color: #9CA3AF; margin: 0;">
                ${greeting} Recebemos um pedido para redefinir a palavra-passe da sua conta no sistema. Utilize o código de verificação abaixo:
              </p>
            </td>
          </tr>

          <!-- Caixa Minimalista do Código de 6 Dígitos -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="background-color: #0A0612; border: 1px solid #3B2A56; border-radius: 16px; padding: 18px 24px; display: inline-block; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #F472B6; display: inline-block; padding-left: 0.25em;">
                  ${code}
                </span>
              </div>
            </td>
          </tr>

          <!-- Aviso de Expiração & Segurança -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="font-size: 12px; color: #9CA3AF; margin: 0; line-height: 1.5;">
                ⏱️ Este código expira em <strong style="color: #FFFFFF;">15 minutos</strong>.<br>
                <span style="color: #6B7280;">Se não solicitou esta alteração, ignore esta mensagem com segurança.</span>
              </p>
            </td>
          </tr>

          <!-- Rodapé Corporativo -->
          <tr>
            <td style="border-top: 1px solid #2A1E3D; padding-top: 20px;">
              <p style="font-size: 11px; color: #6B7280; margin: 0; line-height: 1.5;">
                Açaí da Rose · Rede de Franquias Portugal<br>
                Ambiente Corporativo Seguro & Monitorado
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendPasswordResetEmail({ to, code, name }: SendPasswordResetEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '')
  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'Açaí da Rose <seguranca@acaidarose.pt>').trim().replace(/^["']|["']$/g, '')

  if (!apiKey) {
    console.error('RESEND_API_KEY não configurada no ambiente.')
    return { success: false, error: 'Serviço de e-mail não configurado.' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `Código de Recuperação: ${code} · Açaí da Rose`,
        html: renderMinimalistPasswordResetEmail(code, name),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Erro na resposta do Resend API:', data)
      return { success: false, error: data?.message || 'Falha ao enviar e-mail via Resend.' }
    }

    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Erro de conexão ao Resend API:', err)
    return { success: false, error: err?.message || 'Erro de conexão ao provedor de e-mail.' }
  }
}
