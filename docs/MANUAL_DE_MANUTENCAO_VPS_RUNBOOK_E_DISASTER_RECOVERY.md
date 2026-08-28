# Manual de Manutenção da VPS, Runbook Operacional & Disaster Recovery
**Açaí da Rose — Procedimentos de Suporte TI, Rotinas Preventivas e Recuperação de Desastres**

---

## 1. Ficha Técnica da Infraestrutura de Produção

* **Endereço IP da VPS**: `198.50.117.110`
* **Sistema Operativo**: Ubuntu 24.04 LTS (Kernel Linux Otimizado)
* **Hardware**: 4 vCPUs AMD EPYC, 6 GB RAM, 100 GB NVMe, 2 GB Swap
* **Fuso Horário Oficial**: `Europe/Lisbon` (UTC+0 / UTC+1 no horário de verão)
* **Banco de Dados**: PostgreSQL 16 Alpine (`acaidarose-db` em `127.0.0.1:5432`)
* **Diretório Mestre**: `/root/acaidarose/`

---

## 2. Rotinas de Manutenção Preventiva (Checklist Semanal & Mensal)

### A. Monitoramento Rápido de Saúde da VPS (Via SSH)
```bash
# 1. Verificar uso de Memória RAM e Swap
free -h

# 2. Verificar espaço em disco NVMe
df -h /

# 3. Verificar status dos containers Docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 4. Verificar bloqueios de segurança do Fail2ban
fail2ban-client status sshd
```

---

### B. Limpeza Preventiva do Docker (Executar a cada 30 dias)
```bash
# Remove containers parados, volumes órfãos e imagens não utilizadas
docker system prune -af
```

---

## 3. Plano de Disaster Recovery (Recuperação de Desastres)

* **RPO (Recovery Point Objective)**: Máximo 24 horas (Backups diários automatizados às 03:00 AM).
* **RTO (Recovery Time Objective)**: Menos de **3 minutos** para restauração completa.

### A. Script de Backup Diário (`/root/acaidarose/scripts/backup.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/root/acaidarose/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="acaidarose_prod_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR

# Executa dump compactado diretamente do container PostgreSQL
docker exec -i acaidarose-db pg_dump -U acai_admin -d acaidarose_prod --clean --if-exists | gzip > "${BACKUP_DIR}/${FILENAME}"

# Remove backups com mais de 30 dias para economizar disco NVMe
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

echo "[$(date)] Backup concluído com sucesso: ${FILENAME}" >> /var/log/acaidarose_backups.log
```

---

### B. Procedimento de Restauração de Emergência (Restore em 1 Comando)
Se houver corrupção acidental ou necessidade de restaurar o banco para um estado anterior:

```bash
# 1. Parar temporariamente a aplicação web
cd /root/acaidarose && docker compose stop app

# 2. Restaurar o dump desejado para o banco de dados de produção
gunzip -c /root/acaidarose/backups/acaidarose_prod_ANO-MES-DIA_HORA.sql.gz | docker exec -i acaidarose-db psql -U acai_admin -d acaidarose_prod

# 3. Reiniciar a aplicação web
docker compose start app

# 4. Validar tabelas e registros
docker exec -i acaidarose-db psql -U acai_admin -d acaidarose_prod -c "SELECT name, slug, is_headquarters FROM tenants;"
```

---

## 4. Runbook de Resolução de Incidentes Comuns

| Sintoma / Incidente | Causa Provável | Ação de Resolução Imediata |
| :--- | :--- | :--- |
| **Erro ao conectar no banco (ECONNREFUSED)** | Container `acaidarose-db` pausado | `docker compose up -d db` e verificar logs com `docker logs acaidarose-db --tail 50`. |
| **Disco Cheio (> 90%)** | Acúmulo de logs ou dumps antigos | `docker system prune -af` e verificar `/root/acaidarose/backups/`. |
| **Lentidão em horários de pico** | Conexões abertas não recicladas | Verificar conexões ativas: `docker exec -it acaidarose-db psql -U acai_admin -d acaidarose_prod -c "SELECT count(*) FROM pg_stat_activity;"`. |
| **Aplicação web fora do ar após deploy** | Falha de build Next.js | Executar `docker logs acaidarose-app --tail 100` e reiniciar o container com `docker compose restart app`. |
