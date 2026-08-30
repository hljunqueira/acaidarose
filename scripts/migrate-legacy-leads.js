const mysql = require('mysql2/promise');
const { Client } = require('pg');
require('dotenv').config();

// Configurações de conexões com fallback para produção mapeado nos documentos
const LEGACY_MYSQL_CONFIG = {
  host: process.env.LEGACY_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LEGACY_DB_PORT || '3306'),
  user: process.env.LEGACY_DB_USER || 'u902934419_kyiD3',
  password: process.env.LEGACY_DB_PASSWORD || '9VoZDrLLwi',
  database: process.env.LEGACY_DB_NAME || 'u902934419_crV5L'
};

const NEW_POSTGRES_URL = process.env.DATABASE_URL || 'postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod';

async function migrateLeads() {
  console.log('--------------------------------------------------');
  console.log('INICIANDO MIGRAÇÃO DE LEADS DE FRANQUIA...');
  console.log('--------------------------------------------------');
  console.log(`> Conectando ao MySQL Legado: ${LEGACY_MYSQL_CONFIG.host}:${LEGACY_MYSQL_CONFIG.port} (Banco: ${LEGACY_MYSQL_CONFIG.database})`);
  console.log(`> Conectando ao PostgreSQL Novo: ${NEW_POSTGRES_URL.split('@')[1]}`);

  let mysqlConn;
  let pgClient;

  try {
    // 1. Conectar no MySQL antigo
    mysqlConn = await mysql.createConnection(LEGACY_MYSQL_CONFIG);
    console.log('✔ Conectado ao MySQL com sucesso.');

    // 2. Conectar no PostgreSQL novo
    pgClient = new Client({
      connectionString: NEW_POSTGRES_URL,
      ssl: NEW_POSTGRES_URL.includes('localhost') || NEW_POSTGRES_URL.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });
    await pgClient.connect();
    console.log('✔ Conectado ao PostgreSQL com sucesso.');

    // 3. Buscar submissões do formulário de franquia
    // O Elementor Pro salva o nome do formulário em wp_e_submissions
    console.log('> Buscando submissões antigas com nome de formulário: "franquia", "franchise" ou "candidatura"...');
    
    const [submissions] = await mysqlConn.query(
      `SELECT id, created_at FROM wp_e_submissions 
       WHERE form_name IN ('franquia', 'franchise', 'candidatura', 'candidatura_franquia')`
    );

    if (submissions.length === 0) {
      console.log('ℹ Nenhum lead de franquia encontrado nas tabelas do Elementor Pro.');
      return;
    }

    console.log(`✔ Encontrados ${submissions.length} registros de candidaturas antigos.`);

    let migratedCount = 0;

    for (const sub of submissions) {
      // Buscar todos os campos da submissão na tabela wp_e_submissions_values
      const [values] = await mysqlConn.query(
        `SELECT \`key\`, \`value\` FROM wp_e_submissions_values WHERE submission_id = ?`,
        [sub.id]
      );

      const fields = {};
      values.forEach(v => {
        if (v.key) {
          fields[v.key.toLowerCase()] = v.value;
        }
      });

      // Se não houver campos reais preenchidos (ex: spam vazio), ignora
      if (Object.keys(fields).length === 0) {
        continue;
      }

      // Mapear campos antigos para o JSON esperado no Postgres novo
      const body = {
        type: 'FRANCHISE_APPLICATION',
        nome: fields.nome || fields.name || fields['nome completo'] || 'Candidato Antigo',
        email: fields.email || fields['e-mail'] || '',
        telefone: fields.telefone || fields.phone || fields['telemóvel'] || fields['contacto'] || '',
        cidade: fields.cidade || fields.city || '',
        distrito: fields.distrito || fields.district || 'Aveiro',
        motivo: fields.motivo || fields.reason || fields['mensagem'] || 'Candidatura legada migrada do site WordPress',
        investimento: fields.investimento || fields.investment || '20.000€',
        preferenciaContato: {
          whatsapp: true,
          telefone: false,
          email: false
        },
        termosAceitos: true
      };

      const id = require('crypto').randomUUID();
      const tenantId = '11111111-1111-1111-1111-111111111111'; // ID canônico Matriz Aveiro / Franqueadora
      const title = `Candidatura Migrada: ${body.nome}`;
      const description = body.motivo;

      // 4. Gravar na tabela franchise_requests do PostgreSQL
      // Evita duplicados fazendo verificação por e-mail no JSONB se necessário, ou inserindo com ID UUID
      // Aqui inserimos diretamente, mas podemos rodar uma verificação rápida
      const checkRes = await pgClient.query(
        `SELECT id FROM franchise_requests 
         WHERE requested_changes_json->>'email' = $1`,
        [body.email]
      );

      if (checkRes.rows.length > 0) {
        console.log(`⚠ Ignorado lead duplicado: ${body.nome} (${body.email})`);
        continue;
      }

      await pgClient.query(
        `INSERT INTO franchise_requests (id, tenant_id, request_type, title, description, status, requested_changes_json, created_at, updated_at)
         VALUES ($1, $2, 'FRANCHISE_APPLICATION', $3, $4, 'PENDING', $5, $6, $6)`,
        [
          id,
          tenantId,
          title,
          description,
          JSON.stringify(body),
          sub.created_at || new Date()
        ]
      );

      migratedCount++;
    }

    console.log('--------------------------------------------------');
    console.log(`✔ MIGRAÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`> Candidaturas processadas e importadas: ${migratedCount}`);
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('✖ Erro crítico durante o processo de migração:', error);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    if (pgClient) await pgClient.end();
  }
}

migrateLeads();
