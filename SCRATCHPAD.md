# SCRATCHPAD

## Status Atual: ✅ CONCLUÍDO COM SUCESSO

### Tarefas Executadas nesta Rodada:
1. **Layout Amplo de 2 Colunas no Modal de QR Code**:
   - Modernizado [SingleTableQRDialog.tsx](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/components/admin/tables/SingleTableQRDialog.tsx) com layout panorâmico de 2 colunas, detecção de URL, botões rápidos e preview da placa física.

2. **Resolução 100% Dinâmica do Nome de Cada Filial no QR Code**:
   - O QR code e a placa física de cada mesa agora identificam e exibem automaticamente o nome da respectiva filial (**FILIAL AVEIRO**, **FILIAL LISBOA**, **FILIAL SANTARÉM**, **MATRIZ TORRES NOVAS**).

3. **Compatibilidade de URLs para Produção na Vercel**:
   - Detecção automática de origem via `window.location.origin` (substitui `localhost` dinamicamente por `https://acaidarose.vercel.app`).
