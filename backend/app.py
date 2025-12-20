from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Order, Administer, Risk
from config import Config
from datetime import datetime, timedelta
from sqlalchemy import func
import threading
import time

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# 初始化数据库
db.init_app(app)

# 当前充电状态（用于硬件读取）
current_charging = {
    'status': '空闲',  # 空闲 或 充电中
    'user_number': '',
    'remaining_time': 0,
    'order_id': None
}


# ==================== 管理员API ====================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """管理员登录"""
    data = request.get_json()
    name = data.get('name')
    password = data.get('password')

    admin = Administer.query.filter_by(name=name, password=password).first()
    if admin:
        return jsonify({'code': 200, 'message': '登录成功', 'data': admin.to_dict()})
    else:
        return jsonify({'code': 401, 'message': '账号或密码错误'})


@app.route('/api/admin/charge/list', methods=['GET'])
def get_charge_list():
    """获取充电订单列表"""
    orders = Order.query.order_by(Order.date.desc()).all()
    return jsonify({
        'code': 200,
        'data': [order.to_dict() for order in orders]
    })


@app.route('/api/admin/charge/statistics', methods=['GET'])
def get_charge_statistics():
    """获取每日充电次数统计"""
    # 按日期分组统计充电次数
    results = db.session.query(
        func.date(Order.date).label('date'),
        func.count(Order.id).label('count')
    ).group_by(func.date(Order.date)).order_by(func.date(Order.date)).all()

    statistics = [{'date': str(r.date), 'count': r.count} for r in results]
    return jsonify({'code': 200, 'data': statistics})


@app.route('/api/admin/users', methods=['GET'])
def get_users():
    """获取所有用户列表"""
    users = User.query.all()
    return jsonify({
        'code': 200,
        'data': [user.to_dict() for user in users]
    })


@app.route('/api/admin/risks', methods=['GET'])
def get_risks():
    """获取报警信息列表"""
    risks = Risk.query.order_by(Risk.date.desc()).all()
    return jsonify({
        'code': 200,
        'data': [risk.to_dict() for risk in risks]
    })


@app.route('/api/admin/risks/statistics', methods=['GET'])
def get_risk_statistics():
    """获取每日报警次数统计"""
    results = db.session.query(
        func.date(Risk.date).label('date'),
        func.count(Risk.id).label('count')
    ).group_by(func.date(Risk.date)).order_by(func.date(Risk.date)).all()

    statistics = [{'date': str(r.date), 'count': r.count} for r in results]
    return jsonify({'code': 200, 'data': statistics})


# ==================== 用户API（微信小程序） ====================

@app.route('/api/user/login', methods=['POST'])
def user_login():
    """用户登录"""
    data = request.get_json()
    number = data.get('number')
    password = data.get('password')

    user = User.query.filter_by(number=number, password=password).first()
    if user:
        return jsonify({'code': 200, 'message': '登录成功', 'data': user.to_dict()})
    else:
        return jsonify({'code': 401, 'message': '学号或密码错误'})


@app.route('/api/user/register', methods=['POST'])
def user_register():
    """用户注册"""
    data = request.get_json()
    name = data.get('name')
    number = data.get('number')
    password = data.get('password')

    # 检查学号是否已存在
    existing_user = User.query.filter_by(number=number).first()
    if existing_user:
        return jsonify({'code': 400, 'message': '该学号已注册'})

    user = User(name=name, number=number, password=password, remain=0.0)
    db.session.add(user)
    db.session.commit()

    return jsonify({'code': 200, 'message': '注册成功', 'data': user.to_dict()})


@app.route('/api/user/info/<int:user_id>', methods=['GET'])
def get_user_info(user_id):
    """获取用户信息"""
    user = User.query.get(user_id)
    if user:
        return jsonify({'code': 200, 'data': user.to_dict()})
    else:
        return jsonify({'code': 404, 'message': '用户不存在'})


@app.route('/api/user/recharge', methods=['POST'])
def recharge():
    """用户充值"""
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')

    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'message': '用户不存在'})

    user.remain += amount
    db.session.commit()

    return jsonify({'code': 200, 'message': '充值成功', 'data': user.to_dict()})


@app.route('/api/user/charge', methods=['POST'])
def create_charge_order():
    """创建充电订单"""
    data = request.get_json()
    user_id = data.get('user_id')
    cost = data.get('cost')  # 充电金额
    time = int(cost)  # 充电时长（分钟），与金额相同

    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'message': '用户不存在'})

    # 检查余额
    if user.remain < cost:
        return jsonify({'code': 400, 'message': '余额不足'})

    # 检查是否有正在充电的订单
    if current_charging['status'] == '充电中':
        return jsonify({'code': 400, 'message': '设备正在被使用，请稍后再试'})

    # 扣除余额
    user.remain -= cost
    user.count += 1

    # 创建订单
    order = Order(
        time=time,
        cost=cost,
        user_id=user_id,
        status='charging',
        remaining_time=time
    )
    db.session.add(order)
    db.session.commit()

    # 更新当前充电状态
    current_charging['status'] = '充电中'
    current_charging['user_number'] = user.number
    current_charging['remaining_time'] = time
    current_charging['order_id'] = order.id

    # 启动倒计时线程
    threading.Thread(target=countdown_timer, args=(order.id, time), daemon=True).start()

    return jsonify({'code': 200, 'message': '充电开始', 'data': order.to_dict()})


@app.route('/api/user/orders/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    """获取用户所有订单"""
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.date.desc()).all()
    return jsonify({
        'code': 200,
        'data': [order.to_dict() for order in orders]
    })


@app.route('/api/user/orders/charging/<int:user_id>', methods=['GET'])
def get_charging_orders(user_id):
    """获取用户充电中订单"""
    orders = Order.query.filter_by(user_id=user_id, status='charging').order_by(Order.date.desc()).all()
    return jsonify({
        'code': 200,
        'data': [order.to_dict() for order in orders]
    })


@app.route('/api/user/orders/finished/<int:user_id>', methods=['GET'])
def get_finished_orders(user_id):
    """获取用户已结束订单"""
    orders = Order.query.filter_by(user_id=user_id, status='finished').order_by(Order.date.desc()).all()
    return jsonify({
        'code': 200,
        'data': [order.to_dict() for order in orders]
    })


# ==================== 硬件API ====================

@app.route('/api/hardware/status', methods=['GET'])
def get_charging_status():
    """获取当前充电状态（供硬件OLED显示）"""
    return jsonify({
        'code': 200,
        'data': current_charging
    })


@app.route('/api/hardware/alarm', methods=['POST'])
def report_alarm():
    """硬件报警上报"""
    data = request.get_json()
    reason = data.get('reason')  # 火灾 或 电流过大

    risk = Risk(reason=reason)
    db.session.add(risk)
    db.session.commit()

    # 如果有正在充电的订单，立即停止
    if current_charging['order_id']:
        order = Order.query.get(current_charging['order_id'])
        if order and order.status == 'charging':
            order.status = 'finished'
            order.remaining_time = 0
            db.session.commit()

    # 重置充电状态
    current_charging['status'] = '空闲'
    current_charging['user_number'] = ''
    current_charging['remaining_time'] = 0
    current_charging['order_id'] = None

    return jsonify({'code': 200, 'message': '报警已记录，充电已停止'})


# ==================== 辅助函数 ====================

def countdown_timer(order_id, duration_minutes):
    """倒计时线程，更新订单剩余时间"""
    for remaining in range(duration_minutes, 0, -1):
        time.sleep(60)  # 每分钟更新一次
        with app.app_context():
            order = Order.query.get(order_id)
            if order and order.status == 'charging':
                order.remaining_time = remaining - 1
                current_charging['remaining_time'] = remaining - 1
                db.session.commit()
            else:
                # 订单已被中断
                break

    # 充电完成
    with app.app_context():
        order = Order.query.get(order_id)
        if order and order.status == 'charging':
            order.status = 'finished'
            order.remaining_time = 0
            db.session.commit()

            # 重置充电状态
            if current_charging['order_id'] == order_id:
                current_charging['status'] = '空闲'
                current_charging['user_number'] = ''
                current_charging['remaining_time'] = 0
                current_charging['order_id'] = None


# ==================== 初始化数据库 ====================

@app.route('/api/init', methods=['GET'])
def init_database():
    """初始化数据库（创建表和默认数据）"""
    try:
        db.create_all()

        # 创建默认管理员（如果不存在）
        if not Administer.query.filter_by(name='admin').first():
            admin = Administer(name='admin', password='admin123')
            db.session.add(admin)

        # 创建测试用户（如果不存在）
        if not User.query.filter_by(number='2021001').first():
            test_user = User(
                name='张三',
                number='2021001',
                password='123456',
                remain=100.0
            )
            db.session.add(test_user)

        db.session.commit()
        return jsonify({'code': 200, 'message': '数据库初始化成功'})
    except Exception as e:
        return jsonify({'code': 500, 'message': f'初始化失败: {str(e)}'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
