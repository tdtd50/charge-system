const bcrypt = require('bcrypt');
const { getDatabase } = require('./database');

const SALT_ROUNDS = 10;

// 用户注册
async function registerUser(username, email, password) {
    try {
        const db = await getDatabase();

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword],
                function(err) {
                    db.close();
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed: users.username')) {
                            reject(new Error('用户名已存在'));
                        } else if (err.message.includes('UNIQUE constraint failed: users.email')) {
                            reject(new Error('邮箱已被注册'));
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve({
                            id: this.lastID,
                            username,
                            email
                        });
                    }
                }
            );
        });
    } catch (error) {
        throw error;
    }
}

// 用户登录验证
async function loginUser(username, password) {
    try {
        const db = await getDatabase();

        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM users WHERE username = ?',
                [username],
                async (err, user) => {
                    if (err) {
                        db.close();
                        reject(err);
                        return;
                    }

                    if (!user) {
                        db.close();
                        reject(new Error('用户名或密码错误'));
                        return;
                    }

                    // 验证密码
                    const isValid = await bcrypt.compare(password, user.password);

                    if (!isValid) {
                        db.close();
                        reject(new Error('用户名或密码错误'));
                        return;
                    }

                    // 更新最后登录时间
                    db.run(
                        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                        [user.id],
                        (updateErr) => {
                            db.close();
                            if (updateErr) {
                                console.error('更新登录时间失败:', updateErr);
                            }

                            // 返回用户信息（不包含密码）
                            resolve({
                                id: user.id,
                                username: user.username,
                                email: user.email,
                                created_at: user.created_at,
                                last_login: user.last_login
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        throw error;
    }
}

// 根据 ID 获取用户信息
async function getUserById(userId) {
    try {
        const db = await getDatabase();

        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?',
                [userId],
                (err, user) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(user);
                    }
                }
            );
        });
    } catch (error) {
        throw error;
    }
}

// 获取所有用户（管理员功能）
async function getAllUsers() {
    try {
        const db = await getDatabase();

        return new Promise((resolve, reject) => {
            db.all(
                'SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC',
                [],
                (err, users) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(users);
                    }
                }
            );
        });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    getAllUsers
};
