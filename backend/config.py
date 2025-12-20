import os

class Config:
    """Flask应用配置"""

    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URI',
        'mysql+pymysql://root:123456@localhost:3306/charge'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 密钥配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-production')

    # 跨域配置
    CORS_HEADERS = 'Content-Type'

    # JSON配置
    JSON_AS_ASCII = False  # 支持中文

    # 其他配置
    DEBUG = True
