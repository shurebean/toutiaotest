#!/bin/bash
# 数据库备份脚本

PROJECT_DIR="/home/toutiaotest"
BACKUP_DIR="${PROJECT_DIR}/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/news-${DB:-dev}-${DATE}.db"

echo "========================================"
echo "📦 数据库备份"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份数据库文件
if [ -f "${PROJECT_DIR}/backend/data/news.db" ]; then
    echo "📥 备份数据库文件..."
    cp "${PROJECT_DIR}/backend/data/news.db" "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo "✅ 数据库备份成功: $BACKUP_FILE"

        # 压缩
        echo "🗜️  压缩备份文件..."
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"

        # 显示文件大小
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "📁 压缩后大小: $SIZE"

        # 删除7天前的备份
        echo "🧹 清理旧备份..."
        find "$BACKUP_DIR" -name "*.db.gz" -mtime +7 -delete
        OLD_COUNT=$(find "$BACKUP_DIR" -name "*.db.gz" | wc -l)
        echo "📋 保留备份数量: $OLD_COUNT"
    else
        echo "❌ 数据库备份失败"
        exit 1
    fi
else
    echo "⚠️  数据库文件不存在: ${PROJECT_DIR}/backend/data/news.db"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ 备份完成"
echo "========================================"
