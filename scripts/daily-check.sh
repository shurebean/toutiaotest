#!/bin/bash
# 每日检查脚本

PROJECT_DIR="/home/toutiaotest"
LOG_DIR="${PROJECT_DIR}/logs"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "========================================"
echo "📅 日常检查"
echo "时间: ${DATE}"
echo "========================================"

# 1. 检查服务状态
echo ""
echo "1️⃣ 检查服务状态..."
if [ -f "${PROJECT_DIR}/docker-compose.yml" ]; then
    cd ${PROJECT_DIR}
    docker-compose ps
else
    echo "⚠️  docker-compose.yml 不存在"
fi

# 2. 检查磁盘使用
echo ""
echo "2️⃣ 检查磁盘使用..."
df -h | grep -E "Filesystem|/$"

# 3. 检查内存使用
echo ""
echo "3️⃣ 检查内存使用..."
free -h

# 4. 检查最近的错误日志
echo ""
echo "4️⃣ 最近的错误日志..."
if [ -d "${LOG_DIR}" ]; then
    find ${LOG_DIR} -name "*error*.log" -mtime -1 -exec tail -20 {} \;
else
    echo "⚠️  日志目录不存在"
fi

# 5. 检查备份状态
echo ""
echo "5️⃣ 最近的备份..."
if [ -d "${PROJECT_DIR}/backups" ]; then
    find ${PROJECT_DIR}/backups -type f -mtime -1 -exec ls -lh {} \;
else
    echo "⚠️  备份目录不存在"
fi

echo ""
echo "========================================"
echo "✅ 日常检查完成"
echo "========================================"
