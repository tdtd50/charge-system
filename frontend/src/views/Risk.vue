<template>
  <div class="risk-container">
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>每日报警次数统计</span>
          <el-button type="primary" size="small" @click="loadData">刷新数据</el-button>
        </div>
      </template>
      <div ref="chartRef" style="width: 100%; height: 400px;"></div>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>报警记录列表</span>
      </template>
      <el-table :data="riskList" border stripe style="width: 100%">
        <el-table-column prop="id" label="报警编号" width="100" />
        <el-table-column prop="date" label="日期时间" width="180" />
        <el-table-column prop="reason" label="报警原因" width="150">
          <template #default="{ row }">
            <el-tag :type="row.reason === '火灾' ? 'danger' : 'warning'">
              {{ row.reason }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="200">
          <template #default="{ row }">
            <span v-if="row.reason === '火灾'">检测到烟雾或火焰，已自动断电</span>
            <span v-else>检测到电流过大，已自动断电保护</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getRisks, getRiskStatistics } from '../api'
import * as echarts from 'echarts'

const chartRef = ref(null)
const riskList = ref([])
const statistics = ref([])
let chartInstance = null

const loadData = async () => {
  try {
    // 获取报警列表
    const listRes = await getRisks()
    if (listRes.code === 200) {
      riskList.value = listRes.data
    }

    // 获取统计数据
    const statsRes = await getRiskStatistics()
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
      text: '每日报警次数趋势'
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
      name: '报警次数'
    },
    series: [{
      data: counts,
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#F56C6C'
      },
      areaStyle: {
        color: 'rgba(245, 108, 108, 0.2)'
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
.risk-container {
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
