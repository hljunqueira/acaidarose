import { Language } from '@/hooks/useLanguage';

export interface LegalSection {
  title: string;
  body: string;
}

export interface LegalDoc {
  lastUpdate: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS_CONTENT: Record<Language, LegalDoc> = {
  PT: {
    lastUpdate: 'Última atualização: Março de 2026',
    intro:
      'Bem-vindo ao programa oficial de fidelidade Açaí da Rose. Ao criar a tua conta e utilizar a nossa aplicação, concordas com as regras abaixo.',
    sections: [
      {
        title: '1. Acumulação de Pontos',
        body: 'Os pontos são acumulados nas tuas compras nas lojas físicas Açaí da Rose participantes em Portugal. A regra base atribui 10 pontos por cada 1,00 € gasto, podendo existir campanhas promocionais temporárias com multiplicadores.',
      },
      {
        title: '2. Identificação no Balcão',
        body: 'Para somar pontos, apresenta o teu QR Code dinâmico ou indica o teu número de telemóvel ao operador de caixa antes da finalização do pagamento.',
      },
      {
        title: '3. Resgate de Prémios e Vouchers',
        body: 'Os pontos acumulados podem ser trocados por prémios disponíveis no catálogo da app. Após o resgate, é gerado um voucher válido por 24 horas. Caso o voucher não seja utilizado dentro deste prazo, os pontos são devolvidos automaticamente para a tua conta.',
      },
      {
        title: '4. Validade e Transferência',
        body: 'Os pontos são pessoais, intransferíveis e não convertíveis em dinheiro. Contas inativas por mais de 12 meses consecutivos podem ter os pontos expirados mediante aviso prévio.',
      },
      {
        title: '5. Programa Convidar Amigos',
        body: 'Quando ativo, ao partilhar o teu código de convite com novos clientes, ambos recebem bónus de pontos assim que o convidado completar o registo e realizar a primeira compra elegível.',
      },
      {
        title: '6. Cancelamento e Modificações',
        body: 'A Açaí da Rose reserva-se o direito de atualizar o catálogo de prémios ou alterar estes termos mediante aviso prévio razoável na aplicação. Podes cancelar a tua conta a qualquer momento na secção Perfil.',
      },
    ],
  },
  EN: {
    lastUpdate: 'Last updated: March 2026',
    intro:
      'Welcome to the official Açaí da Rose loyalty program. By creating an account and using our app, you agree to the terms below.',
    sections: [
      {
        title: '1. Earning Points',
        body: 'Points are earned on qualifying purchases at participating Açaí da Rose stores in Portugal. The base rule awards 10 points for every €1.00 spent, and temporary promotional multiplier campaigns may apply.',
      },
      {
        title: '2. Counter Identification',
        body: 'To collect points, show your dynamic QR Code or share your phone number with the cashier before completing payment.',
      },
      {
        title: '3. Redeeming Rewards & Vouchers',
        body: 'Accumulated points can be traded for available rewards in the app catalog. Once redeemed, a voucher valid for 24 hours is issued. If unused within that window, points are automatically refunded to your account.',
      },
      {
        title: '4. Validity & Transferability',
        body: 'Points are personal, non-transferable, and cannot be exchanged for cash. Accounts inactive for more than 12 consecutive months may have their points expire after prior notice.',
      },
      {
        title: '5. Invite Friends Program',
        body: 'When active, sharing your referral code with new customers awards bonus points to both accounts once the invited friend completes registration and makes their first qualifying purchase.',
      },
      {
        title: '6. Cancellation & Updates',
        body: 'Açaí da Rose may update the rewards catalog or these terms with reasonable prior notice in the app. You may delete your account at any time in the Profile section.',
      },
    ],
  },
  ES: {
    lastUpdate: 'Última actualización: Marzo de 2026',
    intro:
      'Bienvenido al programa oficial de fidelidad Açaí da Rose. Al crear tu cuenta y utilizar nuestra aplicación, aceptas las normas siguientes.',
    sections: [
      {
        title: '1. Acumulación de Puntos',
        body: 'Los puntos se acumulan en tus compras en las tiendas físicas Açaí da Rose participantes en Portugal. La regla base otorga 10 puntos por cada 1,00 € gastado, pudiendo existir campañas promocionales temporales con multiplicadores.',
      },
      {
        title: '2. Identificación en Caja',
        body: 'Para sumar puntos, muestra tu Código QR dinámico o indica tu número de móvil al operador de caja antes de finalizar el pago.',
      },
      {
        title: '3. Canje de Premios y Cupones',
        body: 'Los puntos acumulados pueden canjearse por premios disponibles en el catálogo de la app. Tras el canje, se genera un cupón válido por 24 horas. Si no se utiliza dentro de ese plazo, los puntos se devuelven automáticamente a tu cuenta.',
      },
      {
        title: '4. Validez y Transferencia',
        body: 'Los puntos son personales, intransferibles y no canjeables por dinero. Las cuentas inactivas durante más de 12 meses consecutivos pueden ver sus puntos expirados previo aviso.',
      },
      {
        title: '5. Programa Invitar Amigos',
        body: 'Cuando esté activo, al compartir tu código con nuevos clientes, ambos recibiréis puntos de bono en cuanto el invitado complete el registro y realice su primera compra válida.',
      },
      {
        title: '6. Cancelación y Modificaciones',
        body: 'Açaí da Rose se reserva el derecho de actualizar el catálogo de premios o modificar estos términos con aviso previo razonable en la aplicación. Puedes eliminar tu cuenta en cualquier momento en la sección Perfil.',
      },
    ],
  },
};

export const PRIVACY_CONTENT: Record<Language, LegalDoc> = {
  PT: {
    lastUpdate: 'Conformidade RGPD (UE) 2016/679 • Março de 2026',
    intro:
      'A Açaí da Rose valoriza a tua privacidade e protege os teus dados pessoais em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) em vigor em Portugal e na União Europeia.',
    sections: [
      {
        title: '1. Dados Recolhidos',
        body: 'Recolhemos apenas os dados estritamente necessários para a gestão da tua conta de fidelidade: nome completo, @utilizador, número de telemóvel, email (opcional), NIF (opcional para faturação), data de nascimento (opcional para oferta de aniversário) e histórico de pontos e vouchers.',
      },
      {
        title: '2. Finalidade do Tratamento',
        body: 'Os teus dados são utilizados exclusivamente para: (a) gerir a tua conta e saldo de pontos; (b) validar vouchers de resgate nas nossas lojas; (c) identificar a loja mais próxima quando autorizas a localização; e (d) enviar notificações de pontos ou ofertas se consentires expressamente.',
      },
      {
        title: '3. Segurança e Armazenamento',
        body: 'As palavras-passe são armazenadas com encriptação bcrypt irreversível. Os tokens de sessão ficam guardados no cofre seguro do teu dispositivo (Keychain no iOS / Keystore no Android). Nunca vendemos nem partilhamos os teus dados com terceiros para fins comerciais.',
      },
      {
        title: '4. Os Teus Direitos (RGPD)',
        body: 'Podes a qualquer momento aceder, retificar os teus dados em Perfil → Editar Dados, revogar consentimentos de notificações ou solicitar a portabilidade dos teus dados.',
      },
      {
        title: '5. Direito ao Esquecimento (Eliminação)',
        body: 'Podes eliminar integralmente a tua conta a qualquer momento diretamente na app (Perfil → Eliminar Minha Conta) com remoção e anonimização imediata dos teus registos identificáveis.',
      },
    ],
  },
  EN: {
    lastUpdate: 'GDPR (EU) 2016/679 Compliance • March 2026',
    intro:
      'Açaí da Rose values your privacy and protects your personal data in full compliance with the General Data Protection Regulation (GDPR) in Portugal and the European Union.',
    sections: [
      {
        title: '1. Data Collected',
        body: 'We collect only the data strictly necessary to manage your loyalty account: full name, @username, phone number, email (optional), Tax ID (optional for invoicing), birth date (optional for birthday offers), and points/voucher history.',
      },
      {
        title: '2. Purpose of Processing',
        body: 'Your data is used strictly to: (a) manage your account and points balance; (b) validate reward vouchers at our stores; (c) detect the nearest store when you allow location access; and (d) send points or offer notifications only with your explicit consent.',
      },
      {
        title: '3. Security & Storage',
        body: 'Passwords are stored using irreversible bcrypt hashing. Session tokens are kept in your device secure enclave (iOS Keychain / Android Keystore). We never sell or share your personal data with third parties for marketing.',
      },
      {
        title: '4. Your Rights (GDPR)',
        body: 'At any time you may access or update your data in Profile → Edit Details, revoke notification permissions, or request data portability.',
      },
      {
        title: '5. Right to Erasure (Account Deletion)',
        body: 'You can permanently delete your account directly inside the app at any time (Profile → Delete My Account) with immediate removal and anonymization of your identifiable records.',
      },
    ],
  },
  ES: {
    lastUpdate: 'Cumplimiento RGPD (UE) 2016/679 • Marzo de 2026',
    intro:
      'Açaí da Rose valora tu privacidad y protege tus datos personales conforme al Reglamento General de Protección de Datos (RGPD) vigente en Portugal y la Unión Europea.',
    sections: [
      {
        title: '1. Datos Recogidos',
        body: 'Recogemos únicamente los datos estrictamente necesarios para gestionar tu cuenta de fidelidad: nombre completo, @usuario, número de móvil, email (opcional), NIF (opcional para facturación), fecha de nacimiento (opcional para regalo de cumpleaños) e historial de puntos y cupones.',
      },
      {
        title: '2. Finalidad del Tratamiento',
        body: 'Tus datos se utilizan exclusivamente para: (a) gestionar tu cuenta y saldo de puntos; (b) validar cupones de canje en nuestras tiendas; (c) identificar la tienda más cercana si autorizas la ubicación; y (d) enviar notificaciones de puntos u ofertas solo con tu consentimiento expreso.',
      },
      {
        title: '3. Seguridad y Almacenamiento',
        body: 'Las contraseñas se almacenan con cifrado bcrypt irreversible. Los tokens de sesión se guardan en el almacenamiento seguro de tu dispositivo (Keychain en iOS / Keystore en Android). Nunca vendemos ni compartimos tus datos con terceros con fines comerciales.',
      },
      {
        title: '4. Tus Derechos (RGPD)',
        body: 'Puedes acceder y rectificar tus datos en cualquier momento desde Perfil → Editar Datos, revocar permisos de notificaciones o solicitar la portabilidad de tus datos.',
      },
      {
        title: '5. Derecho al Olvido (Eliminación)',
        body: 'Puedes eliminar íntegramente tu cuenta en cualquier momento directamente en la app (Perfil → Eliminar Mi Cuenta) con eliminación y anonimización inmediata de tus registros identificables.',
      },
    ],
  },
};
