#!/bin/bash
# 新闻抓取调度器管理脚本

PROJECT_DIR="/home/toutiaotest"
LOG_DIR="${PROJECT_DIR}/logs"
PID_FILE="${PROJECT_DIR}/.scheduler.pid"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 检查调度器是否运行
function check_scheduler() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    else
        return 1
    fi
}

# 启动调度器
function start_scheduler() {
    print_info "启动新闻抓取调度器..."
    
    if check_scheduler; then
        print_warning "调度器已在运行中"
        return 0
    fi
    
    cd "$PROJECT_DIR"
    nohup node scheduler-toutiao.js > "$LOG_DIR/scheduler-out.log" 2> "$LOG_DIR/scheduler-error.log" &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    sleep 2
    
    if check_scheduler; then
        print_success "新闻抓取调度器启动成功 (PID: $pid)"
        print_info "日志文件: $LOG_DIR/scheduler-out.log"
        print_info "错误日志: $LOG_DIR/scheduler-error.log"
        return 0
    else
        print_error "调度器启动失败"
        print_info "查看日志: cat $LOG_DIR/scheduler-error.log"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止调度器
function stop_scheduler() {
    print_info "停止新闻抓取调度器..."
    
    if check_scheduler; then
        local pid=$(cat "$PID_FILE")
        kill "$pid"
        sleep 2
        
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -9 "$pid"
        fi
        
        rm -f "$PID_FILE"
        print_success "调度器已停止"
        return 0
    else
        print_warning "调度器未运行"
        return 1
    fi
}

# 重启调度器
function restart_scheduler() {
    stop_scheduler
    sleep 2
    start_scheduler
}

# 查看状态
function show_status() {
    echo "========================================"
    echo "📊 新闻抓取调度器状态"
    echo "========================================"
    echo ""
    
    if check_scheduler; then
        local pid=$(cat "$PID_FILE")
        print_success "调度器正在运行"
        print_info "PID: $pid"
        print_info "日志目录: $LOG_DIR"
        
        # 查看最近日志
        echo ""
        echo "📝 最近日志 (最后10行):"
        echo "---"
        tail -n 10 "$LOG_DIR/scheduler-out.log" 2>/dev/null || echo "暂无日志"
    else
        print_error "调度器未运行"
        print_info "使用 'start' 命令启动调度器"
    fi
    
    echo ""
    echo "========================================"
}

# 手动执行一次抓取
function run_once() {
    print_info "执行一次性新闻抓取..."
    cd "$PROJECT_DIR"
    node scheduler-toutiao.js once
}

# 推送最新新闻
function push_news() {
    print_info "推送最新新闻到飞书..."
    cd "$PROJECT_DIR"
    node scheduler-toutiao.js push
}

# 显示帮助
function show_help() {
    echo "========================================"
    echo "📚 新闻抓取调度器管理脚本"
    echo "========================================"
    echo ""
    echo "用法: ./news-scheduler.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start       - 启动调度器"
    echo "  stop        - 停止调度器"
    echo "  restart     - 重启调度器"
    echo "  status      - 查看状态"
    echo "  once        - 执行一次抓取任务"
    echo "  push        - 推送最新新闻到飞书"
    echo "  help        - 显示此帮助信息"
    echo ""
    echo "========================================"
}

# 主函数
case "$1" in
    start)
        start_scheduler
        ;;
    stop)
        stop_scheduler
        ;;
    restart)
        restart_scheduler
        ;;
    status)
        show_status
        ;;
    once)
        run_once
        ;;
    push)
        push_news
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
