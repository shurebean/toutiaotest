# 运维维护手册

**维护人员**: 运维团队
**最后更新**: 2026-03-05

---

## 日常维护

### 1. 每日检查

#### 检查项
- [ ] 服务状态检查
- [ ] 错误日志检查
- [ ] 资源使用检查
- [ ] 备份检查

**执行脚本**:
```bash
cd /home/toutiaotest && ./scripts/daily-check.sh
```

#### 检查内容
```bash
# 服务状态
docker-compose ps

# 最近错误
tail -50 logs/backend/error.log

# 资源使用
df -h
free -h

# 备份状态
ls -lh backups/
```

### 2. 每周维护

#### 检查项
- [ ] 系统更新
- [ ] 依赖更新
- [ ] 日志归档
- [ ] 性能分析
- [ ] 安全扫描

### 3. 每月维护

#### 检查项
- [ ] 数据库优化
- [ ] 磁盘清理
- [ ] 备份验证
- [ ] 性能调优
- [ ] 容量评估

---

## 数据备份

### 备份策略

#### 1. 数据库备份
- **频率**: 每日
- **保留**: 最近7天
- **备份位置**: `/home/toutiaotest/backups/database/`

**执行备份**:
```bash
cd /home/toutiaotest && ./scripts/backup-database.sh
```

#### 2. 配置文件备份
- **频率**: 每次更新后
- **保留**: 永久
- **备份位置**: `/home/toutiaotest/backups/config/`

#### 3. 完整备份
- **频率**: 每周
- **保留**: 最近4周
- **备份位置**: `/home/toutiaotest/backups/full/`

### 恢复数据库

```bash
cd /home/toutiaotest

# 查看可用备份
ls -lht backups/database/

# 恢复指定备份
./scripts/restore-database.sh backups/database/news-dev-20260305_140000.db.gz
```

---

## 监控告警

### 监控指标

#### 系统指标
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络流量

#### 应用指标
- 服务可用性
- API响应时间
- 错误率
- 请求量

#### 业务指标
- 抓取成功率
- 数据更新频率
- 用户访问量

### 告警规则

#### P0 - 严重告警
- [x] 服务完全不可用
- [x] 数据库连接失败
- [x] API错误率 > 50%
- [x] 磁盘使用率 > 90%

**处理**: 立即电话通知 + 短信通知

#### P1 - 高优先级
- [x] API响应时间 > 3s
- [x] 错误率 > 10%
- [x] 内存使用率 > 80%
- [x] 抓取失败

**处理**: 邮件通知 + 即时消息

#### P2 - 中优先级
- [x] API响应时间 > 1s
- [x] 错误率 > 5%
- [x] 磁盘使用率 > 80%

**处理**: 邮件通知

#### P3 - 低优先级
- [x] 定期维护提醒
- [x] 配置变更通知

**处理**: 定期报告

---

## 故障处理

### 常见问题

#### 1. 服务启动失败

**症状**: 容器无法启动

**排查步骤**:
```bash
# 1. 查看容器日志
docker-compose logs backend

# 2. 检查端口占用
netstat -tulpn | grep :5000

# 3. 检查磁盘空间
df -h

# 4. 检查内存
free -h
```

**解决方案**:
- 检查日志中的错误信息
- 清理磁盘空间
- 增加内存
- 检查配置文件

#### 2. API响应慢

**症状**: 接口响应时间 > 1s

**排查步骤**:
```bash
# 1. 测试数据库性能
time sqlite3 backend/data/news.db 'SELECT COUNT(*) FROM news;'

# 2. 检查系统负载
top

# 3. 检查网络
ping -c 5 8.8.8.8
```

**解决方案**:
- 优化数据库查询
- 添加索引
- 使用缓存
- 优化网络

#### 3. 数据丢失

**症状**: 数据库文件损坏或数据丢失

**解决方案**:
```bash
# 1. 从备份恢复
./scripts/restore-database.sh backups/database/news-dev-20260305_120000.db.gz

# 2. 验证数据完整性
sqlite3 backend/data/news.db 'SELECT COUNT(*) FROM news;'
```

---

## 安全加固

### 1. 系统安全

#### 更新系统
```bash
# 每月执行系统更新
apt update && apt upgrade -y
```

#### 配置防火墙
```bash
# 只开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. 应用安全

#### 定期更新依赖
```bash
# 每月检查依赖更新
cd /home/toutiaotest/backend
npm audit

cd /home/toutiaotest/frontend
npm audit
```

---

## 性能优化

### 1. 数据库优化

```bash
# 定期运行VACUUM和ANALYZE
sqlite3 /home/toutiaotest/backend/data/news.db 'VACUUM; ANALYZE;'
```

### 2. 日志优化

```bash
# 定期清理旧日志
find /home/toutiaotest/logs/ -name "*.log" -mtime +30 -delete
find /home/toutiaotest/logs/ -name "*.log.gz" -mtime +90 -delete
```

---

## 应急预案

### 服务宕机

1. 立即检查服务状态
2. 查看错误日志
3. 尝试重启服务
4. 如果重启失败，从备份恢复
5. 通知相关人员

### 数据丢失

1. 立即停止写操作
2. 从最近备份恢复
3. 验证数据完整性
4. 通知相关人员
5. 调查丢失原因

---

## 快速参考

### 启动服务
```bash
cd /home/toutiaotest
docker-compose up -d
```

### 停止服务
```bash
cd /home/toutiaotest
docker-compose down
```

### 查看日志
```bash
# 所有服务
docker-compose logs

# 特定服务
docker-compose logs backend
docker-compose logs frontend
```

### 重启服务
```bash
cd /home/toutiaotest
docker-compose restart backend
```

### 更新代码
```bash
cd /home/toutiaotest
git pull

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

---

**文档版本**: v1.0
**维护人员**: 运维团队
**最后更新**: 2026-03-05
