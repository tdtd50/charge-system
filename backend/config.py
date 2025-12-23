import os

class Config:
    """Flask应用配置"""

    # 数据库配置
    # 使用 SQLite 作为本地开发数据库，文件为 dev.db（无需 MySQL 服务）
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URI',
        'sqlite:///./dev.db'
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
