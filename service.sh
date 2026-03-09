#!/bin/bash
# 服务管理脚本

PROJECT_DIR="/home/toutiaotest"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
LOG_DIR="${PROJECT_DIR}/logs"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# 检查服务是否运行
function check_backend() {
    if pgrep -f "node.*index-api.js" > /dev/null; then
        return 0
    else
        return 1
    fi
}

function check_frontend() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 启动后端
function start_backend() {
    print_info "启动后端服务..."

    if check_backend; then
        print_warning "后端服务已在运行"
        return 0
    fi

    cd "$BACKEND_DIR"
    nohup node index-api.js > "$LOG_DIR/backend-out.log" 2> "$LOG_DIR/backend-error.log" &

    sleep 2

    if check_backend; then
        print_success "后端服务启动成功"
        print_info "后端日志: tail -f $LOG_DIR/backend-out.log"
        print_info "错误日志: tail -f $LOG_DIR/backend-error.log"
        return 0
    else
        print_error "后端服务启动失败"
        print_info "查看日志: cat $LOG_DIR/backend-error.log"
        return 1
    fi
}

# 停止后端
function stop_backend() {
    print_info "停止后端服务..."

    if ! check_backend; then
        print_warning "后端服务未运行"
        return 0
    fi

    pkill -f "node.*index-api.js"

    sleep 1

    if check_backend; then
        print_error "后端服务停止失败"
        return 1
    else
        print_success "后端服务停止成功"
        return 0
    fi
}

# 启动前端
function start_frontend() {
    print_info "启动前端服务..."

    if check_frontend; then
        print_warning "前端服务已在运行"
        return 0
    fi

    cd "$FRONTEND_DIR"
    nohup npm run dev > "$LOG_DIR/frontend-out.log" 2> "$LOG_DIR/frontend-error.log" &

    sleep 3

    if check_frontend; then
        print_success "前端服务启动成功"
        print_info "前端日志: tail -f $LOG_DIR/frontend-out.log"
        print_info "错误日志: tail -f $LOG_DIR/frontend-error.log"
        return 0
    else
        print_error "前端服务启动失败"
        print_info "查看日志: cat $LOG_DIR/frontend-error.log"
        return 1
    fi
}

# 停止前端
function stop_frontend() {
    print_info "停止前端服务..."

    if ! check_frontend; then
        print_warning "前端服务未运行"
        return 0
    fi

    pkill -f "vite"

    sleep 1

    if check_frontend; then
        print_error "前端服务停止失败"
        return 1
    else
        print_success "前端服务停止成功"
        return 0
    fi
}

# 显示状态
function show_status() {
    echo "========================================"
    echo "📊 服务状态"
    echo "========================================"

    if check_backend; then
        echo ""
        print_success "后端服务: 运行中"
        print_info "  地址: http://localhost:5000"
        HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo 'N/A')
        print_info "  健康检查: $HEALTH"
    else
        echo ""
        print_error "后端服务: 未运行"
    fi

    if check_frontend; then
        echo ""
        print_success "前端服务: 运行中"
        print_info "  地址: http://localhost:3000"
    else
        echo ""
        print_error "前端服务: 未运行"
    fi

    echo ""
    echo "========================================"
}

# 重启服务
function restart() {
    stop_backend
    stop_frontend
    sleep 2
    start_backend
    start_frontend
}

# 显示帮助
function show_help() {
    echo "========================================"
    echo "📚 服务管理脚本"
    echo "========================================"
    echo ""
    echo "用法: ./service.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start          - 启动所有服务"
    echo "  stop           - 停止所有服务"
    echo "  restart        - 重启所有服务"
    echo "  status         - 查看服务状态"
    echo "  start-backend  - 仅启动后端"
    echo "  stop-backend   - 仅停止后端"
    echo "  start-frontend - 仅启动前端"
    echo "  stop-frontend  - 仅停止前端"
    echo "  help           - 显示此帮助信息"
    echo ""
    echo "========================================"
}

# 主函数
case "$1" in
    start)
        start_backend
        start_frontend
        show_status
        ;;
    stop)
        stop_backend
        stop_frontend
        print_success "所有服务已停止"
        ;;
    restart)
        restart
        show_status
        ;;
    status)
        show_status
        ;;
    start-backend)
        start_backend
        ;;
    stop-backend)
        stop_backend
        ;;
    start-frontend)
        start_frontend
        ;;
    stop-frontend)
        stop_frontend
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
