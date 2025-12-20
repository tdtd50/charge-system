<template>
  <div class="user-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" size="small" @click="loadUsers">刷新数据</el-button>
        </div>
      </template>
      <el-table :data="userList" border stripe style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="number" label="学号" width="150" />
        <el-table-column prop="count" label="充电总次数" width="120" />
        <el-table-column prop="remain" label="账户余额（元）" width="150">
          <template #default="{ row }">
            ¥{{ row.remain.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="账号信息" min-width="200">
          <template #default="{ row }">
            <div>账号：{{ row.number }}</div>
            <div style="margin-top: 5px;">密码：********</div>
          </template>
        </el-table-column>
      </el-table>

      <div class="statistics-info">
        <el-statistic title="用户总数" :value="userList.length" />
        <el-statistic title="充电总次数" :value="totalChargeCount" />
        <el-statistic title="账户余额总计" :value="totalRemain" :precision="2" prefix="¥" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUsers } from '../api'

const userList = ref([])

const totalChargeCount = computed(() => {
  return userList.value.reduce((sum, user) => sum + user.count, 0)
})

const totalRemain = computed(() => {
  return userList.value.reduce((sum, user) => sum + user.remain, 0)
})

const loadUsers = async () => {
  try {
    const res = await getUsers()
    if (res.code === 200) {
      userList.value = res.data
      ElMessage.success('数据加载成功')
    } else {
      ElMessage.error(res.message || '数据加载失败')
    }
  } catch (error) {
    ElMessage.error('数据加载失败')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistics-info {
  display: flex;
  gap: 40px;
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
