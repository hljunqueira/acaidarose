export interface CountryCode {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  // Principais / Frequentes
  { name: 'Portugal', dial_code: '+351', code: 'PT', flag: '🇵🇹' },
  { name: 'Brasil', dial_code: '+55', code: 'BR', flag: '🇧🇷' },
  { name: 'Espanha', dial_code: '+34', code: 'ES', flag: '🇪🇸' },
  { name: 'França', dial_code: '+33', code: 'FR', flag: '🇫🇷' },
  { name: 'Reino Unido', dial_code: '+44', code: 'GB', flag: '🇬🇧' },
  { name: 'Estados Unidos', dial_code: '+1', code: 'US', flag: '🇺🇸' },
  { name: 'Alemanha', dial_code: '+49', code: 'DE', flag: '🇩🇪' },
  { name: 'Suíça', dial_code: '+41', code: 'CH', flag: '🇨🇭' },
  { name: 'Itália', dial_code: '+39', code: 'IT', flag: '🇮🇹' },
  { name: 'Angola', dial_code: '+244', code: 'AO', flag: '🇦🇴' },
  { name: 'Moçambique', dial_code: '+258', code: 'MZ', flag: '🇲🇿' },
  { name: 'Cabo Verde', dial_code: '+238', code: 'CV', flag: '🇨🇻' },
  { name: 'Luxemburgo', dial_code: '+352', code: 'LU', flag: '🇱🇺' },
  { name: 'Bélgica', dial_code: '+32', code: 'BE', flag: '🇧🇪' },
  { name: 'Países Baixos', dial_code: '+31', code: 'NL', flag: '🇳🇱' },
  { name: 'Canadá', dial_code: '+1', code: 'CA', flag: '🇨🇦' },
  { name: 'Irlanda', dial_code: '+353', code: 'IE', flag: '🇮🇪' },
  { name: 'São Tomé e Príncipe', dial_code: '+239', code: 'ST', flag: '🇸🇹' },
  { name: 'Guiné-Bissau', dial_code: '+245', code: 'GW', flag: '🇬🇼' },
  { name: 'Timor-Leste', dial_code: '+670', code: 'TL', flag: '🇹🇱' },

  // Europa
  { name: 'Andorra', dial_code: '+376', code: 'AD', flag: '🇦🇩' },
  { name: 'Áustria', dial_code: '+43', code: 'AT', flag: '🇦🇹' },
  { name: 'Bulgária', dial_code: '+359', code: 'BG', flag: '🇧🇬' },
  { name: 'Chipre', dial_code: '+357', code: 'CY', flag: '🇨🇾' },
  { name: 'Croácia', dial_code: '+385', code: 'HR', flag: '🇭🇷' },
  { name: 'Dinamarca', dial_code: '+45', code: 'DK', flag: '🇩🇰' },
  { name: 'Eslováquia', dial_code: '+421', code: 'SK', flag: '🇸🇰' },
  { name: 'Eslovénia', dial_code: '+386', code: 'SI', flag: '🇸🇮' },
  { name: 'Estónia', dial_code: '+372', code: 'EE', flag: '🇪🇪' },
  { name: 'Finlândia', dial_code: '+358', code: 'FI', flag: '🇫🇮' },
  { name: 'Grécia', dial_code: '+30', code: 'GR', flag: '🇬🇷' },
  { name: 'Hungria', dial_code: '+36', code: 'HU', flag: '🇭🇺' },
  { name: 'Islândia', dial_code: '+354', code: 'IS', flag: '🇮🇸' },
  { name: 'Letónia', dial_code: '+371', code: 'LV', flag: '🇱🇻' },
  { name: 'Lituânia', dial_code: '+370', code: 'LT', flag: '🇱🇹' },
  { name: 'Malta', dial_code: '+356', code: 'MT', flag: '🇲🇹' },
  { name: 'Mónaco', dial_code: '+377', code: 'MC', flag: '🇲🇨' },
  { name: 'Noruega', dial_code: '+47', code: 'NO', flag: '🇳🇴' },
  { name: 'Polónia', dial_code: '+48', code: 'PL', flag: '🇵🇱' },
  { name: 'República Checa', dial_code: '+420', code: 'CZ', flag: '🇨🇿' },
  { name: 'Roménia', dial_code: '+40', code: 'RO', flag: '🇷🇴' },
  { name: 'Suécia', dial_code: '+46', code: 'SE', flag: '🇸🇪' },
  { name: 'Ucrânia', dial_code: '+380', code: 'UA', flag: '🇺🇦' },

  // Américas
  { name: 'Argentina', dial_code: '+54', code: 'AR', flag: '🇦🇷' },
  { name: 'Bolívia', dial_code: '+591', code: 'BO', flag: '🇧🇴' },
  { name: 'Chile', dial_code: '+56', code: 'CL', flag: '🇨🇱' },
  { name: 'Colômbia', dial_code: '+57', code: 'CO', flag: '🇨🇴' },
  { name: 'Costa Rica', dial_code: '+506', code: 'CR', flag: '🇨🇷' },
  { name: 'Cuba', dial_code: '+53', code: 'CU', flag: '🇨🇺' },
  { name: 'Equador', dial_code: '+593', code: 'EC', flag: '🇪🇨' },
  { name: 'Guatemala', dial_code: '+502', code: 'GT', flag: '🇬🇹' },
  { name: 'México', dial_code: '+52', code: 'MX', flag: '🇲🇽' },
  { name: 'Panamá', dial_code: '+507', code: 'PA', flag: '🇵🇦' },
  { name: 'Paraguai', dial_code: '+595', code: 'PY', flag: '🇵🇾' },
  { name: 'Peru', dial_code: '+51', code: 'PE', flag: '🇵🇪' },
  { name: 'Uruguai', dial_code: '+598', code: 'UY', flag: '🇺🇾' },
  { name: 'Venezuela', dial_code: '+58', code: 'VE', flag: '🇻🇪' },

  // África e Médio Oriente
  { name: 'África do Sul', dial_code: '+27', code: 'ZA', flag: '🇿🇦' },
  { name: 'Argélia', dial_code: '+213', code: 'DZ', flag: '🇩🇿' },
  { name: 'Egito', dial_code: '+20', code: 'EG', flag: '🇪🇬' },
  { name: 'Emirados Árabes Unidos', dial_code: '+971', code: 'AE', flag: '🇦🇪' },
  { name: 'Israel', dial_code: '+972', code: 'IL', flag: '🇮🇱' },
  { name: 'Marrocos', dial_code: '+212', code: 'MA', flag: '🇲🇦' },
  { name: 'Nigéria', dial_code: '+234', code: 'NG', flag: '🇳🇬' },
  { name: 'Senegal', dial_code: '+221', code: 'SN', flag: '🇸🇳' },
  { name: 'Tunísia', dial_code: '+216', code: 'TN', flag: '🇹🇳' },

  // Ásia e Oceania
  { name: 'Austrália', dial_code: '+61', code: 'AU', flag: '🇦🇺' },
  { name: 'China', dial_code: '+86', code: 'CN', flag: '🇨🇳' },
  { name: 'Coreia do Sul', dial_code: '+82', code: 'KR', flag: '🇰🇷' },
  { name: 'Filipinas', dial_code: '+63', code: 'PH', flag: '🇵🇭' },
  { name: 'Índia', dial_code: '+91', code: 'IN', flag: '🇮🇳' },
  { name: 'Indonésia', dial_code: '+62', code: 'ID', flag: '🇮🇩' },
  { name: 'Japão', dial_code: '+81', code: 'JP', flag: '🇯🇵' },
  { name: 'Nova Zelândia', dial_code: '+64', code: 'NZ', flag: '🇳🇿' },
  { name: 'Singapura', dial_code: '+65', code: 'SG', flag: '🇸🇬' },
  { name: 'Tailândia', dial_code: '+66', code: 'TH', flag: '🇹🇭' },
];
