const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carregar o SVG do QR Code gerado anteriormente
const svgPath = path.join(__dirname, '..', 'public', 'qrcode-contatos-acaidarose.svg');
let svgContent = '';
if (fs.existsSync(svgPath)) {
  svgContent = fs.readFileSync(svgPath, 'utf8');
}

const htmlContent = `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Açaí da Rose — Contactos Oficiais & Redes</title>
  <meta name="description" content="Contactos oficiais, WhatsApp, Fixo, Redes Sociais e Site do Açaí da Rose.">
  <link rel="icon" type="image/png" href="/logo-oficial.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: linear-gradient(180deg, #180126 0%, #240338 50%, #11001c 100%);
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 32px 16px 48px;
      -webkit-font-smoothing: antialiased;
    }
    a {
      text-decoration: none;
      color: inherit;
    }

    /* Container Central */
    .container {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Logo Header */
    .logo-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 28px;
      padding: 16px 26px;
      margin-bottom: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(16px);
      display: inline-block;
    }
    .logo-box img {
      height: 64px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-bottom: 4px;
    }
    .brand-title span.reg {
      font-size: 13px;
      color: #f472b6;
      margin-top: -10px;
    }
    .brand-subtitle {
      font-size: 13px;
      color: rgba(233, 213, 255, 0.8);
      font-weight: 500;
      margin-bottom: 26px;
    }

    /* Lista de Botões */
    .links-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 13px;
    }
    .link-card {
      width: 100%;
      padding: 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      text-align: left;
    }
    .link-card:hover {
      transform: scale(1.02);
    }
    .link-card:active {
      transform: scale(0.98);
    }

    .link-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .icon-box {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-box svg {
      width: 22px;
      height: 22px;
      stroke-width: 2.2;
    }

    .link-text .title {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 3px;
    }
    .link-text .sub {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.9;
      font-family: monospace;
    }

    /* Cores dos Cards */
    .card-whatsapp {
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.95), rgba(16, 185, 129, 0.95));
      border: 1px solid rgba(110, 231, 183, 0.35);
      box-shadow: 0 10px 25px rgba(6, 78, 59, 0.4);
    }
    .card-whatsapp .icon-box {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .card-fixo {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(10px);
    }
    .card-fixo .icon-box {
      background: rgba(219, 39, 119, 0.2);
      color: #f472b6;
      border: 1px solid rgba(219, 39, 119, 0.3);
    }

    .card-site {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(10px);
    }
    .card-site .icon-box {
      background: rgba(147, 51, 234, 0.2);
      color: #c084fc;
      border: 1px solid rgba(147, 51, 234, 0.3);
    }
    .card-site .sub {
      font-family: inherit;
    }

    .card-instagram {
      background: linear-gradient(135deg, rgba(131, 58, 180, 0.85), rgba(253, 29, 29, 0.85), rgba(252, 176, 69, 0.85));
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 10px 25px rgba(253, 29, 29, 0.25);
    }
    .card-instagram .icon-box {
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }
    .card-instagram .sub {
      font-family: inherit;
    }

    .card-facebook {
      background: linear-gradient(135deg, rgba(24, 119, 242, 0.95), rgba(13, 89, 194, 0.95));
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 10px 25px rgba(24, 119, 242, 0.3);
    }
    .card-facebook .icon-box {
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }
    .card-facebook .sub {
      font-family: inherit;
    }

    .card-vcard {
      background: linear-gradient(135deg, #db2777, #9333ea);
      border: 1px solid rgba(244, 114, 182, 0.4);
      box-shadow: 0 12px 30px rgba(219, 39, 119, 0.35);
    }
    .card-vcard .icon-box {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }
    .card-vcard .sub {
      font-family: inherit;
    }

    .arrow-icon svg {
      width: 18px;
      height: 18px;
      opacity: 0.65;
    }

    /* Rodapé Limpo */
    .hub-footer {
      width: 100%;
      margin-top: 26px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: rgba(233, 213, 255, 0.7);
    }
    .footer-btn {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 10px;
      transition: all 0.2s;
      font-size: 12px;
      font-weight: 600;
    }
    .footer-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
    .footer-btn.btn-qr {
      color: #f472b6;
      font-weight: 800;
    }

    /* Modal: SOMENTE O QR CODE */
    .qr-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(10, 0, 18, 0.85);
      backdrop-filter: blur(12px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }
    .qr-modal.active {
      display: flex;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .qr-modal-content {
      background: #1b022b;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 32px;
      padding: 28px 24px 24px;
      max-width: 360px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.7);
      position: relative;
    }

    .qr-close-btn {
      position: absolute;
      top: 14px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      line-height: 1;
      transition: all 0.2s;
    }
    .qr-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .qr-modal-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 20px;
    }

    /* Container do QR Code - SOMENTE O QR CODE */
    .qr-box-single {
      background: #ffffff;
      padding: 16px;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box-single svg {
      width: 240px;
      height: 240px;
      display: block;
    }

    .btn-download-qr {
      width: 100%;
      padding: 12px 18px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 800;
      background: #db2777;
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 6px 20px rgba(219, 39, 119, 0.4);
      transition: all 0.2s;
    }
    .btn-download-qr:hover {
      background: #be185d;
      transform: scale(1.02);
    }
  </style>
</head>
<body>

  <div class="container">

    <!-- Logo Header -->
    <div class="logo-box">
      <img src="/logo-oficial.png" alt="Açaí da Rose Oficial">
    </div>

    <div class="brand-title">
      Açaí da Rose <span class="reg">®</span>
    </div>
    <div class="brand-subtitle">
      O Autêntico Açaí Brasileiro · Contactos Oficiais
    </div>

    <!-- Lista de Links Diretos -->
    <div class="links-list">

      <!-- 1. WhatsApp -->
      <a href="https://wa.me/351911050264?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20do%20A%C3%A7a%C3%AD%20da%20Rose." target="_blank" rel="noopener noreferrer" class="link-card card-whatsapp">
        <div class="link-left">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div class="link-text">
            <div class="title">Conversar no WhatsApp</div>
            <div class="sub">911 050 264</div>
          </div>
        </div>
        <div class="arrow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>
      </a>

      <!-- 2. Telefone Fixo -->
      <a href="tel:+351249825131" class="link-card card-fixo">
        <div class="link-left">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div class="link-text">
            <div class="title">Ligar para o Fixo</div>
            <div class="sub">249 825 131</div>
          </div>
        </div>
        <div class="arrow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>
      </a>

      <!-- 3. Site Oficial -->
      <a href="https://acaidarose.pt" target="_blank" rel="noopener noreferrer" class="link-card card-site">
        <div class="link-left">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <div class="link-text">
            <div class="title">Site & Ementa Digital</div>
            <div class="sub">acaidarose.pt</div>
          </div>
        </div>
        <div class="arrow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>
      </a>

      <!-- 4. Instagram Oficial -->
      <a href="https://www.instagram.com/acaidarose_pt" target="_blank" rel="noopener noreferrer" class="link-card card-instagram">
        <div class="link-left">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </div>
          <div class="link-text">
            <div class="title">Instagram Oficial</div>
            <div class="sub">@acaidarose_pt</div>
          </div>
        </div>
        <div class="arrow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>
      </a>

      <!-- 5. Facebook Oficial -->
      <a href="https://www.facebook.com/profile.php?id=61550988842732&sk=directory_personal_details" target="_blank" rel="noopener noreferrer" class="link-card card-facebook">
        <div class="link-left">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </div>
          <div class="link-text">
            <div class="title">Facebook Oficial</div>
            <div class="sub">Açaí da Rose</div>
          </div>
        </div>
        <div class="arrow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>
      </a>

      <!-- 6. Salvar Contacto na Agenda -->
      <div onclick="downloadVCard()" class="link-card card-vcard">
        <div class="link-left">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          </div>
          <div class="link-text">
            <div class="title">Guardar na Agenda</div>
            <div class="sub">Salvar contacto com todos os números</div>
          </div>
        </div>
        <div class="arrow-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </div>
      </div>

    </div>

    <!-- Rodapé Limpo -->
    <div class="hub-footer">
      <button class="footer-btn" onclick="copyLink()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span id="copy-text">Copiar Link</span>
      </button>

      <button class="footer-btn btn-qr" onclick="openQrModal()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        <span>Ver QR Code</span>
      </button>
    </div>

  </div>

  <!-- MODAL: SOMENTE O QR CODE -->
  <div id="qr-modal" class="qr-modal" onclick="closeQrModal(event)">
    <div class="qr-modal-content" onclick="event.stopPropagation()">
      <button class="qr-close-btn" onclick="closeQrModal()">&times;</button>
      <div class="qr-modal-title">QR Code dos Contactos</div>
      <div class="qr-box-single">
        ${svgContent}
      </div>
      <button class="btn-download-qr" onclick="downloadQrPng()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>Baixar Imagem (PNG)</span>
      </button>
    </div>
  </div>

  <script>
    function openQrModal() {
      document.getElementById('qr-modal').classList.add('active');
    }

    function closeQrModal(e) {
      if (!e || e.target === document.getElementById('qr-modal') || e.target.classList.contains('qr-close-btn')) {
        document.getElementById('qr-modal').classList.remove('active');
      }
    }

    function downloadVCard() {
      const vCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Açaí da Rose',
        'ORG:Açaí da Rose',
        'TITLE:O Autêntico Açaí Brasileiro',
        'TEL;TYPE=WORK,VOICE:+351249825131',
        'TEL;TYPE=CELL,VOICE,WHATSAPP:+351911050264',
        'URL:https://acaidarose.pt',
        'X-SOCIALPROFILE;type=instagram:https://www.instagram.com/acaidarose_pt',
        'X-SOCIALPROFILE;type=facebook:https://www.facebook.com/profile.php?id=61550988842732&sk=directory_personal_details',
        'NOTE:Açaí da Rose - O Autêntico Açaí Brasileiro em Portugal.\\nFixo: 249 825 131\\nWhatsApp: 911 050 264\\nSite: https://acaidarose.pt\\nInstagram: @acaidarose_pt\\nFacebook: Açaí da Rose',
        'END:VCARD'
      ].join('\\r\\n');

      const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Acai_da_Rose_Contactos.vcf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    function copyLink() {
      navigator.clipboard.writeText('https://acaidarose.pt/links').then(() => {
        const copyText = document.getElementById('copy-text');
        copyText.innerText = 'Copiado!';
        setTimeout(() => { copyText.innerText = 'Copiar Link'; }, 2000);
      });
    }

    function downloadQrPng() {
      const svg = document.querySelector('.qr-box-single svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 1000;
      canvas.height = 1000;

      img.onload = function() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'QRCode_Acai_da_Rose_Oficial.png';
        link.href = pngUrl;
        link.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  </script>
</body>
</html>
`;

// Criar pasta links se não existir
const linksDir = path.join(__dirname, '..', 'legacy-static', 'links');
if (!fs.existsSync(linksDir)) {
  fs.mkdirSync(linksDir, { recursive: true });
}

// Salvar links/index.html e links.html
fs.writeFileSync(path.join(linksDir, 'index.html'), htmlContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'legacy-static', 'links.html'), htmlContent, 'utf8');
console.log('✅ Arquivos HTML atualizados com Instagram @acaidarose_pt.');

// Transferir para a VPS via SCP direto
const VPS_HOST = '198.50.117.110';
const VPS_USER = 'root';
const VPS_DEST = '/etc/icontainer/apps/nginx/nginx/www/sites/acaidarose.pt/index';

console.log('📤 Enviando arquivos limpos diretamente para a VPS...');
execSync(`ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_DEST}/links"`, { stdio: 'inherit' });
execSync(`scp -o StrictHostKeyChecking=no legacy-static/links/index.html ${VPS_USER}@${VPS_HOST}:${VPS_DEST}/links/index.html`, { stdio: 'inherit' });
execSync(`scp -o StrictHostKeyChecking=no legacy-static/links.html ${VPS_USER}@${VPS_HOST}:${VPS_DEST}/links.html`, { stdio: 'inherit' });

// Reload Nginx
console.log('⚙️ Recarregando Nginx na VPS...');
execSync(`ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "docker exec ic-nginx-PHXo nginx -s reload"`, { stdio: 'inherit' });
console.log('🚀 Deploy ao vivo com Instagram @acaidarose_pt concluído com sucesso!');
