<template>
  <el-container class="admin-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h3>管理系统</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/charge">
          <el-icon><Histogram /></el-icon>
          <span>充电数据</span>
        </el-menu-item>
        <el-menu-item index="/admin/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/risk">
          <el-icon><Warning /></el-icon>
          <span>风险查看</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h2>充电桩管理系统</h2>
        </div>
        <div class="header-right">
          <span class="admin-name">{{ adminName }}</span>
          <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const adminName = computed(() => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}')
  return adminInfo.name || '管理员'
})

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('adminInfo')
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.admin-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  height: 100vh;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;
  color: #fff;
}

.sidebar-menu {
  border: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left h2 {
  font-size: 20px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.admin-name {
  color: #666;
  font-size: 14px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
