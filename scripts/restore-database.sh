#!/bin/bash
# 数据库恢复脚本

PROJECT_DIR="/home/toutiaotest"
BACKUP_FILE=$1
TEMP_FILE="/tmp/news-restored.db"

if [ -z "$BACKUP_FILE" ]; then
    echo "========================================"
    echo "❌ 错误: 未指定备份文件"
    echo ""
    echo "用法: ./restore-database.sh <backup-file>"
    echo ""
    echo "可用备份:"
    echo ""
    if [ -d "${PROJECT_DIR}/backups/database" ]; then
        ls -lht ${PROJECT_DIR}/backups/database/*.gz | head -10
    else
        echo "⚠️  备份目录不存在"
    fi
    echo "========================================"
    exit 1
fi

echo "========================================"
echo "📥 数据库恢复"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# 检查备份文件
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 备份当前数据库
echo "📦 备份当前数据库..."
if [ -f "${PROJECT_DIR}/backend/data/news.db" ]; then
    cp "${PROJECT_DIR}/backend/data/news.db" "${PROJECT_DIR}/backend/data/news.db.backup-$(date +%Y%m%d_%H%M%S)"
    echo "✅ 当前数据库已备份"
fi

# 解压备份文件
echo "🗜️  解压备份文件..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# 验证备份文件
echo "🔍 验证备份文件..."
if ! file "$TEMP_FILE" | grep -q "SQLite"; then
    echo "⚠️  警告: 文件可能不是有效的SQLite数据库"
    read -p "是否继续? (y/N): " confirm
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        echo "❌ 恢复取消"
        rm -f "$TEMP_FILE"
        exit 1
    fi
fi

# 恢复数据库
echo "📥 恢复数据库..."
cp "$TEMP_FILE" "${PROJECT_DIR}/backend/data/news.db"

if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功"

    # 显示统计信息
    echo ""
    echo "📊 数据库统计:"
    if command -v sqlite3 &> /dev/null; then
        TOTAL=$(sqlite3 "${PROJECT_DIR}/backend/data/news.db" "SELECT COUNT(*) FROM news;" 2>/dev/null)
        echo "   新闻总数: ${TOTAL:-未知}"
    fi
else
    echo "❌ 数据库恢复失败"
    rm -f "$TEMP_FILE"
    exit 1
fi

# 清理临时文件
rm -f "$TEMP_FILE"

echo ""
echo "========================================"
echo "✅ 恢复完成"
echo "========================================"
