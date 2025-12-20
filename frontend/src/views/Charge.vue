<template>
  <div class="charge-container">
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>每日充电次数统计</span>
          <el-button type="primary" size="small" @click="loadData">刷新数据</el-button>
        </div>
      </template>
      <div ref="chartRef" style="width: 100%; height: 400px;"></div>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>充电记录列表</span>
      </template>
      <el-table :data="chargeList" border stripe style="width: 100%">
        <el-table-column prop="id" label="充电编号" width="100" />
        <el-table-column prop="date" label="日期时间" width="180" />
        <el-table-column prop="user_name" label="用户姓名" width="120" />
        <el-table-column prop="user_number" label="学号" width="150" />
        <el-table-column prop="time" label="充电时长（分钟）" width="150" />
        <el-table-column prop="cost" label="充电金额（元）" width="150">
          <template #default="{ row }">
            ¥{{ row.cost.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'charging' ? 'success' : 'info'">
              {{ row.status === 'charging' ? '充电中' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getChargeList, getChargeStatistics } from '../api'
import * as echarts from 'echarts'

const chartRef = ref(null)
const chargeList = ref([])
const statistics = ref([])
let chartInstance = null

const loadData = async () => {
  try {
    // 获取充电列表
    const listRes = await getChargeList()
    if (listRes.code === 200) {
      chargeList.value = listRes.data
    }

    // 获取统计数据
    const statsRes = await getChargeStatistics()
    if (statsRes.code === 200) {
      statistics.value = statsRes.data
      await nextTick()
      renderChart()
    }

    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败')
  }
}

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const dates = statistics.value.map(item => item.date)
  const counts = statistics.value.map(item => item.count)

  const option = {
    title: {
      text: '每日充电次数趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates,
      name: '日期'
    },
    yAxis: {
      type: 'value',
      name: '充电次数'
    },
    series: [{
      data: counts,
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: 'rgba(64, 158, 255, 0.2)'
      }
    }]
  }

  chartInstance.setOption(option)
}

onMounted(() => {
  loadData()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
.charge-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-card, .table-card {
  width: 100%;
}
</style>
