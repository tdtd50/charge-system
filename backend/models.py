from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    """用户表"""
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(100), nullable=False)
    number = db.Column(db.String(20), unique=True, nullable=False)  # 学号
    count = db.Column(db.Integer, default=0)  # 充电总次数
    remain = db.Column(db.Float, default=0.0)  # 账户余额

    # 关联订单
    orders = db.relationship('Order', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'number': self.number,
            'count': self.count,
            'remain': self.remain
        }


class Order(db.Model):
    """订单表"""
    __tablename__ = 'order'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    time = db.Column(db.Integer, nullable=False)  # 充电时长（分钟）
    date = db.Column(db.DateTime, default=datetime.now)  # 订单创建日期
    cost = db.Column(db.Float, nullable=False)  # 充电金额
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='charging')  # charging: 充电中, finished: 已结束
    remaining_time = db.Column(db.Integer)  # 剩余时间（分钟）

    def to_dict(self):
        return {
            'id': self.id,
            'time': self.time,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S'),
            'cost': self.cost,
            'user_id': self.user_id,
            'status': self.status,
            'remaining_time': self.remaining_time,
            'user_name': self.user.name if self.user else None,
            'user_number': self.user.number if self.user else None
        }


class Administer(db.Model):
    """管理员表"""
    __tablename__ = 'administer'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }


class Risk(db.Model):
    """报警信息表"""
    __tablename__ = 'risk'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reason = db.Column(db.String(50), nullable=False)  # 火灾 或 电流过大
    date = db.Column(db.DateTime, default=datetime.now)  # 发生报警的日期

    def to_dict(self):
        return {
            'id': self.id,
            'reason': self.reason,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S')
        }
