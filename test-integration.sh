#!/bin/bash

echo "🧪 开始集成测试..."
echo "========================================"

# 测试1: 健康检查
echo "测试1: 健康检查"
HEALTH=$(curl -s http://localhost:5000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ 健康检查通过"
else
  echo "❌ 健康检查失败"
  exit 1
fi

# 测试2: 板块列表
echo ""
echo "测试2: 板块列表"
CATEGORIES=$(curl -s http://localhost:5000/api/categories)
if echo "$CATEGORIES" | grep -q '"success":true'; then
  echo "✅ 板块列表获取成功"
else
  echo "❌ 板块列表获取失败"
  exit 1
fi

# 测试3: 新闻列表
echo ""
echo "测试3: 新闻列表"
NEWS=$(curl -s http://localhost:5000/api/news?category=tech)
if echo "$NEWS" | grep -q '"success":true'; then
  echo "✅ 新闻列表获取成功"
else
  echo "❌ 新闻列表获取失败"
  exit 1
fi

# 测试4: 搜索功能
echo ""
echo "测试4: 搜索功能"
SEARCH=$(curl -s "http://localhost:5000/api/search?q=%E7%A7%91%E6%99%AF")
if echo "$SEARCH" | grep -q '"success":true'; then
  echo "✅ 搜索功能正常"
else
  echo "❌ 搜索功能失败"
  exit 1
fi

echo ""
echo "========================================"
echo "✅ 所有集成测试通过！"
echo "========================================"
