#!/bin/bash

echo "========================================"
echo "🚀 开始部署流程"
echo "========================================"
echo ""

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "node index-api.js" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2
echo "✅ 服务已停止"
echo ""

# 构建前端
echo "📦 构建前端应用..."
cd /home/toutiaotest/frontend
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 前端构建失败"
  exit 1
fi
echo "✅ 前端构建完成"
echo ""

# 启动后端服务
echo "📦 启动后端服务..."
cd /home/toutiaotest/backend
node index-api.js > /tmp/backend-deploy.log 2>&1 &
BACKEND_PID=$!
sleep 3

# 测试后端
echo "🧪 测试后端服务..."
HEALTH=$(curl -s http://localhost:5000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ 后端服务正常"
else
  echo "❌ 后端服务异常"
  exit 1
fi
echo ""

# 启动前端服务
echo "📦 启动前端服务..."
cd /home/toutiaotest/frontend
npx serve -l 3000 -s dist > /tmp/frontend-deploy.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# 测试前端
echo "🧪 测试前端服务..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ 前端服务正常"
else
  echo "❌ 前端服务异常 (状态码: $FRONTEND_STATUS)"
  exit 1
fi
echo ""

echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "📋 访问地址:"
echo "   后端API: http://localhost:5000"
echo "   前端应用: http://localhost:3000"
echo "   健康检查: http://localhost:5000/health"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
