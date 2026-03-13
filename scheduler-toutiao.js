#!/usr/bin/env node
/**
 * 今日头条新闻抓取定时任务
 * 定时从今日头条/微博/百度获取热点新闻并推送到飞书
 * 推送时间：每天 7:00、、11:00、15:00、19:00、23:00
 */

const cron = require('node-cron');
const { main: scrapeToutiao } = require('./toutiao_scraper');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'scheduler-toutiao.log');
const FEISHU_GROUP_ID = 'oc_dbf77c9e962f14b7c207d9cb4ec336fa'; // 当前飞书群组ID

// 推送时间点：7:00、15:00、23:00（白天每8小时一次，晚上不发）
const SCHEDULE_TIMES = ['7', '15', '23'];

// 新闻摘要目录
const NEWS_DIR = '/home/toutiaotest/news';

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  // 输出到控制台
  console.log(logMessage.trim());
  
  // 写入日志文件
  fs.appendFileSync(LOG_FILE, logMessage);
}

let isRunning = false;

// 检查当前时间是否在推送时间点
function isScheduledTime() {
  const now = new Date();
  const currentHour = now.getHours().toString();
  return SCHEDULE_TIMES.includes(currentHour);
}

// 推送到飞书群组
async function pushToFeishu(newsData) {
  try {
    if (!newsData || !newsData.news || newsData.news.length === 0) {
      log('没有新闻数据，跳过推送', 'WARN');
      return false;
    }

    // 格式化消息
    const top10 = newsData.news.slice(0, 10);
    let message = `📰 **热点新闻摘要（今日头条）**\n\n`;
    message += `🕐 更新时间：${new Date(newsData.timestamp).toLocaleString('zh-CN', { 
      timeZone: 'Asia/Shanghai', 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    })}\n\n`;
    
    message += `🔥 **Top 10 热点：**\n\n`;
    top10.forEach((item, i) => {
      message += `${i + 1}. ${item.title}\n`;
    });
    
    message += `\n---\n\n`;
    message += `📊 ${newsData.count} 条新闻 | 来源: ${newsData.source}`;

    // 使用 OpenClaw CLI 发送消息
    // 将消息写入临时文件
    const tempFile = path.join(LOG_DIR, 'feishu-message.txt');
    fs.writeFileSync(tempFile, message);

    // 调用 openclaw 发送消息
    const command = `openclaw message send --channel feishu --target ${FEISHU_GROUP_ID} --message "${message.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
    
    log('正在推送到飞书群组...');
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000,
        env: process.env,
        shell: '/bin/bash'
      });
      
      if (stdout) {
        log(`✅ 飞书推送成功`);
        return true;
      } else {
        log(`⚠️ 飞书推送无响应`, 'WARN');
        return false;
      }
    } catch (execError) {
      log(`❌ 飞书推送失败: ${execError.message}`, 'ERROR');
      return false;
    }

  } catch (error) {
    log(`❌ 推送失败: ${error.message}`, 'ERROR');
    return false;
  }
}

// 抓取任务
async function runScrapeTask() {
  if (isRunning) {
    log('上一次抓取任务还在运行中，跳过本次执行', 'WARN');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    log('========================================');
    log('开始执行新闻抓取任务');
    log('========================================');

    const result = await scrapeToutiao();

    if (result) {
      log(`✅ 抓取成功: ${result.count} 条新闻`);
      log(`   来源: ${result.source}`);
      log(`   时间: ${result.timestamp}`);

      // 推送到飞书群组
      log('准备推送到飞书群组...');
      const pushSuccess = await pushToFeishu(result);
      
      if (pushSuccess) {
        log('✅ 飞书推送完成');
      } else {
        log('⚠️ 飞书推送失败（已记录）', 'WARN');
      }
    } else {
      log('⚠️  抓取失败或无数据', 'WARN');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`任务耗时: ${duration} 秒`);
    log('========================================\n');

  } catch (error) {
    log(`❌ 抓取任务失败: ${error.message}`, 'ERROR');
    console.error(error);
  } finally {
    isRunning = false;
  }
}

// 启动定时任务
function startScheduler() {
  // 每小时检查一次，但只在指定时间点执行
  const cronPattern = '0 * * * *';
  
  const job = cron.schedule(cronPattern, () => {
    if (isScheduledTime()) {
      log(`🕰️ 到达推送时间点，开始执行任务`);
      runScrapeTask();
    } else {
      log(`⏰ 非推送时间，跳过`);
    }
  }, {
    scheduled: true
  });

  log('🕰️  定时任务调度器已启动');
  log(`   Cron表达式: ${cronPattern} (每小时检查)`);
  log(`   推送时间: 每天 ${SCHEDULE_TIMES.join(':00、')}:00`);
  log(`   飞书群组: ${FEISHU_GROUP_ID}`);
  log(`   日志文件: ${LOG_FILE}`);
  log(`   新闻目录: ${NEWS_DIR}`);
  log('');
  
  // 立即执行一次（如果是推送时间）
  if (isScheduledTime()) {
    log('当前是推送时间，立即执行首次抓取任务...');
    runScrapeTask();
  } else {
    log(`当前时间不是推送时间点，将在 ${SCHEDULE_TIMES.join(':00、')}:00 自动执行`);
  }
}

// 停止定时任务
function stopScheduler() {
  log('⏹️  定时任务调度器已停止');
  process.exit(0);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'once':
      log('🔄 手动执行一次抓取任务...');
      runScrapeTask().then(() => process.exit(0));
      break;
    
    case 'push':
      (async () => {
        log('🔄 先抓取最新新闻，然后推送到飞书...');
        // 先抓取最新数据
        const scrapeResult = await scrapeToutiao();
        
        if (scrapeResult && scrapeResult.count > 0) {
          log(`✅ 抓取成功: ${scrapeResult.count} 条新闻`);
          // 推送刚抓取的数据
          const pushResult = await pushToFeishu(scrapeResult);
          if (pushResult) {
            log('✅ 推送完成');
            process.exit(0);
          } else {
            log('❌ 推送失败', 'ERROR');
            process.exit(1);
          }
        } else {
          log('❌ 抓取失败或无数据', 'ERROR');
          process.exit(1);
        }
      })();
      break;
    
    case 'status':
      const now = new Date();
      const currentHour = now.getHours().toString();
      const isPushTime = SCHEDULE_TIMES.includes(currentHour);
      log('📊 调度器状态:');
      log(`   当前时间: ${now.toLocaleString('zh-CN')}`);
      log(`   是否推送时间: ${isPushTime ? '是' : '否'}`);
      log(`   推送时间点: ${SCHEDULE_TIMES.join(':00、')}:00`);
      process.exit(0);
      break;
    
    case 'help':
      console.log(`
今日头条新闻抓取调度器

用法:
  node scheduler-toutiao.js [命令]

命令:
    (无参数)  - 启动定时任务调度器
    once      - 执行一次抓取任务后退出
    push      - 推送最新新闻到飞书（不抓取）
    status    - 查看调度器状态
    help      - 显示帮助信息

配置:
    推送时间: 每天 7:00、11:00、15:00、19:00、23:00
      `);
      process.exit(0);
      break;
    
    default:
      // 启动调度器
      startScheduler();
      
      // 优雅退出
      process.on('SIGINT', stopScheduler);
      process.on('SIGTERM', stopScheduler);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { runScrapeTask, pushToFeishu };
