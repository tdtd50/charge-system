import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token（如果有的话）
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// ==================== 管理员API ====================

// 管理员登录
export const adminLogin = (data) => {
  return request.post('/admin/login', data)
}

// 获取充电订单列表
export const getChargeList = () => {
  return request.get('/admin/charge/list')
}

// 获取每日充电统计
export const getChargeStatistics = () => {
  return request.get('/admin/charge/statistics')
}

// 获取所有用户
export const getUsers = () => {
  return request.get('/admin/users')
}

// 获取报警信息
export const getRisks = () => {
  return request.get('/admin/risks')
}

// 获取每日报警统计
export const getRiskStatistics = () => {
  return request.get('/admin/risks/statistics')
}

export default request
