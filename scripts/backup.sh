#!/bin/bash
BACKUP_DIR="/root/acaidarose/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="acaidarose_prod_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Executa dump compactado diretamente do container PostgreSQL
docker exec -i acaidarose-db pg_dump -U acai_admin -d acaidarose_prod --clean --if-exists | gzip > "${BACKUP_DIR}/${FILENAME}"

# Remove backups com mais de 30 dias para economizar disco NVMe
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

echo "[$(date)] Backup concluido com sucesso: ${FILENAME} ($(du -h ${BACKUP_DIR}/${FILENAME} | cut -f1))" >> /var/log/acaidarose_backups.log
