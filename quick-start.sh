#!/bin/bash
# 快速启动脚本

PROJECT_DIR="/home/toutiaotest"

echo "========================================"
echo "🚀 今日头条热点抓取系统 - 快速启动"
echo "========================================"
echo ""

cd "$PROJECT_DIR"

# 检查依赖
echo "1️⃣ 检查依赖..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 安装依赖
echo "2️⃣ 检查依赖包..."
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi

echo "✅ 依赖检查完成"
echo ""

# 检查数据库
echo "3️⃣ 检查数据库..."
if [ ! -f "backend/data/news.db" ]; then
    echo "⚠️  数据库不存在，将自动创建"
fi

echo "✅ 数据库检查完成"
echo ""

# 启动服务
echo "4️⃣ 启动服务..."
./service.sh start

echo ""
echo "========================================"
echo "🎉 启动完成！"
echo "========================================"
echo ""
echo "📱 访问地址:"
echo "   前端应用: http://localhost:3000"
echo "   后端API: http://localhost:5000"
echo "   健康检查: http://localhost:5000/health"
echo ""
echo "📝 常用命令:"
echo "   查看状态: ./service.sh status"
echo "   停止服务: ./service.sh stop"
echo "   重启服务: ./service.sh restart"
echo ""
echo "📚 查看日志:"
echo "   后端日志: tail -f logs/backend-out.log"
echo "   错误日志: tail -f logs/backend-error.log"
echo ""
echo "========================================"
