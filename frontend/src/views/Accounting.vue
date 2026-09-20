<template>
  <div class="acc-apple">
    <!-- 导航 -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">💰</span>
          <span class="brand-text">记账本</span>
        </div>
        <div class="nav-actions">
          <NotificationBell />
          <el-dropdown @command="onCommand">
            <div class="user-chip">
              <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" class="user-avatar-img" alt="" />
              <div v-else class="user-avatar">{{ userStore.userInfo?.username?.[0]?.toUpperCase() }}</div>
              <span class="user-name">{{ userStore.userInfo?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">🏠 首页</el-dropdown-item>
                <el-dropdown-item command="board">💬 留言板</el-dropdown-item>
                <el-dropdown-item command="todo">📝 待办</el-dropdown-item>
                <el-dropdown-item command="blog">📚 博客</el-dropdown-item>
                <el-dropdown-item command="profile" divided>👤 个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </nav>

    <main class="main">
      <!-- Hero + 月份选择 -->
      <section class="hero">
        <div class="hero-top">
          <div>
            <h1 class="hero-title">
              本月<span class="gradient-text">收支一览</span>
            </h1>
            <p class="hero-subtitle">记录每一笔，看清钱去哪了</p>
          </div>
          <div class="month-picker">
            <button class="month-btn" @click="changeMonth(-1)">‹</button>
            <input type="month" v-model="currentMonth" @change="reloadAll" />
            <button class="month-btn" @click="changeMonth(1)">›</button>
          </div>
        </div>

        <!-- 三卡片 -->
        <div class="overview">
          <div class="ov-card income">
            <div class="ov-label">收入</div>
            <div class="ov-value">¥ {{ overview.income.toFixed(2) }}</div>
            <div class="ov-count">{{ overview.incomeCount }} 笔</div>
          </div>
          <div class="ov-card expense">
            <div class="ov-label">支出</div>
            <div class="ov-value">¥ {{ overview.expense.toFixed(2) }}</div>
            <div class="ov-count">{{ overview.expenseCount }} 笔</div>
          </div>
          <div class="ov-card balance">
            <div class="ov-label">结余</div>
            <div class="ov-value" :class="{ negative: overview.balance < 0 }">
              ¥ {{ overview.balance.toFixed(2) }}
            </div>
            <div class="ov-count">共 {{ overview.incomeCount + overview.expenseCount }} 笔</div>
          </div>
        </div>
      </section>

      <!-- 图表区 -->
      <section class="charts">
        <div class="chart-card">
          <div class="chart-head">
            <h3>支出分类</h3>
          </div>
          <v-chart v-if="categoryData.length" :option="pieOption" style="height: 300px" autoresize />
          <div v-else class="chart-empty">
            <div class="empty-icon">🍩</div>
            <div>本月无支出</div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-head">
            <h3>收支趋势</h3>
            <span class="chart-sub">近 6 个月</span>
          </div>
          <v-chart :option="trendOption" style="height: 300px" autoresize />
        </div>
      </section>

      <!-- 账单列表 -->
      <section class="bills-card">
        <div class="bills-head">
          <h3>本月账单</h3>
          <button class="add-btn" @click="openDialog">
            <span>+</span>
            <span>记一笔</span>
          </button>
        </div>

        <div v-loading="loading" class="bills-list">
          <div v-for="bill in bills" :key="bill.id" class="bill-item">
            <div class="bill-icon" :class="{ income: bill.type === 1 }">
              {{ bill.category?.icon || '💰' }}
            </div>
            <div class="bill-info">
              <div class="bill-cat">{{ bill.category?.name || '未分类' }}</div>
              <div class="bill-remark">
                {{ bill.remark || '无备注' }}
                <span class="bill-date"> · {{ formatDate(bill.bill_date) }}</span>
              </div>
            </div>
            <div class="bill-amount" :class="{ income: bill.type === 1 }">
              {{ bill.type === 1 ? '+' : '-' }} {{ Number(bill.amount).toFixed(2) }}
            </div>
            <button class="bill-del" @click="onDelete(bill)">×</button>
          </div>

          <div v-if="!loading && !bills.length" class="empty">
            <div class="empty-icon">📒</div>
            <div class="empty-title">本月还没有账单</div>
            <div class="empty-desc">点右上角"记一笔"开始吧</div>
          </div>
        </div>

        <div v-if="total > 20" class="pagination">
          <button :disabled="page === 1" @click="page--; loadBills()">‹</button>
          <span>{{ page }} / {{ Math.ceil(total / 20) }}</span>
          <button :disabled="page >= Math.ceil(total / 20)" @click="page++; loadBills()">›</button>
        </div>
      </section>
    </main>

    <!-- 记一笔弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="记一笔"
      width="440px"
      :close-on-click-modal="false"
    >
      <div class="dialog-form">
        <div class="type-switch">
          <button :class="{ active: form.type === 0 }" @click="form.type = 0; form.category_id = ''">
            支出
          </button>
          <button :class="{ active: form.type === 1 }" @click="form.type = 1; form.category_id = ''">
            收入
          </button>
        </div>

        <div class="amount-input">
          <span class="currency">¥</span>
          <input
            v-model.number="form.amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
          />
        </div>

        <div class="field">
          <label>分类</label>
          <div class="category-grid">
            <button
              v-for="c in filteredCategories"
              :key="c.id"
              class="cat-btn"
              :class="{ active: form.category_id === c.id }"
              @click="form.category_id = c.id"
            >
              <span class="cat-icon">{{ c.icon }}</span>
              <span class="cat-name">{{ c.name }}</span>
            </button>
          </div>
        </div>

        <div class="field">
          <label>日期</label>
          <input type="date" v-model="form.bill_date" />
        </div>

        <div class="field">
          <label>备注</label>
          <input v-model="form.remark" placeholder="选填" maxlength="100" />
        </div>
      </div>

      <template #footer>
        <button class="dialog-btn cancel" @click="dialogVisible = false">取消</button>
        <button class="dialog-btn primary" @click="onSubmit">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { PieChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useUserStore } from '@/stores/user';
import * as billApi from '@/api/bill';
import NotificationBell from '@/components/NotificationBell.vue';

use([PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

const router = useRouter();
const userStore = useUserStore();

const currentMonth = ref(new Date().toISOString().slice(0, 7));
const overview = reactive({ income: 0, expense: 0, balance: 0, incomeCount: 0, expenseCount: 0 });
const categoryData = ref([]);
const trendData = ref({ months: [], income: [], expense: [] });
const bills = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const categories = ref([]);
const dialogVisible = ref(false);

const form = reactive({
  type: 0,
  amount: null,
  category_id: '',
  bill_date: new Date().toISOString().slice(0, 10),
  remark: ''
});

const filteredCategories = computed(() =>
  categories.value.filter(c => c.type === form.type)
);

const pieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  legend: { bottom: 0, icon: 'circle', textStyle: { color: '#86868b', fontSize: 12 } },
  color: ['#0071e3', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa', '#ffcc00', '#8e8e93'],
  series: [{
    type: 'pie',
    radius: ['50%', '72%'],
    center: ['50%', '45%'],
    padAngle: 3,
    itemStyle: { borderRadius: 6 },
    data: categoryData.value.map(i => ({
      name: `${i.icon} ${i.name}`,
      value: i.value
    })),
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 14, fontWeight: 600 }
    }
  }]
}));

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['收入', '支出'],
    right: 0,
    top: 0,
    icon: 'circle',
    textStyle: { color: '#86868b', fontSize: 12 }
  },
  grid: { left: 40, right: 16, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: trendData.value.months,
    axisLine: { lineStyle: { color: '#e5e5ea' } },
    axisLabel: { color: '#86868b', fontSize: 12 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f5f5f7' } },
    axisLabel: { color: '#86868b', fontSize: 12 }
  },
  series: [
    {
      name: '收入', type: 'line', data: trendData.value.income, smooth: true,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 2.5, color: '#34c759' },
      itemStyle: { color: '#34c759' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(52, 199, 89, 0.2)' },
            { offset: 1, color: 'rgba(52, 199, 89, 0)' }
          ]
        }
      }
    },
    {
      name: '支出', type: 'line', data: trendData.value.expense, smooth: true,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 2.5, color: '#ff3b30' },
      itemStyle: { color: '#ff3b30' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 59, 48, 0.2)' },
            { offset: 1, color: 'rgba(255, 59, 48, 0)' }
          ]
        }
      }
    }
  ]
}));

// ============ 数据加载 ============
async function loadOverview() {
  const data = await billApi.getOverview(currentMonth.value);
  Object.assign(overview, data);
}
async function loadCategoryStats() {
  categoryData.value = await billApi.getCategoryStats(currentMonth.value, 0);
}
async function loadTrend() {
  trendData.value = await billApi.getTrend(6);
}
async function loadBills() {
  loading.value = true;
  try {
    const data = await billApi.getBills({ month: currentMonth.value, page: page.value, size: 20 });
    bills.value = data.list;
    total.value = data.total;
  } catch (e) {}
  loading.value = false;
}
async function loadCategories() {
  categories.value = await billApi.getCategories();
}
async function reloadAll() {
  page.value = 1;
  await Promise.all([loadOverview(), loadCategoryStats(), loadBills(), loadTrend()]);
}

// ============ 操作 ============
function changeMonth(delta) {
  const [y, m] = currentMonth.value.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  currentMonth.value = d.toISOString().slice(0, 7);
  reloadAll();
}

function openDialog() {
  form.type = 0;
  form.amount = null;
  form.category_id = '';
  form.bill_date = new Date().toISOString().slice(0, 10);
  form.remark = '';
  dialogVisible.value = true;
}

async function onSubmit() {
  if (!form.amount || form.amount <= 0) return ElMessage.warning('请输入金额');
  if (!form.category_id) return ElMessage.warning('请选择分类');
  if (!form.bill_date) return ElMessage.warning('请选择日期');

  try {
    await billApi.createBill(form);
    ElMessage.success('记账成功');
    dialogVisible.value = false;
    reloadAll();
  } catch (e) {}
}

async function onDelete(bill) {
  try {
    await ElMessageBox.confirm('确定删除这笔账单？', '提示', { type: 'warning' });
    await billApi.deleteBill(bill.id);
    ElMessage.success('删除成功');
    reloadAll();
  } catch (e) {}
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function onCommand(cmd) {
  const map = { home: '/home', board: '/board', todo: '/todo', blog: '/blog', profile: '/profile' };
  if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
  } else if (map[cmd]) {
    router.push(map[cmd]);
  }
}

onMounted(async () => {
  await loadCategories();
  await reloadAll();
});
</script>

<style scoped>
.acc-apple {
  min-height: 100vh;
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #1d1d1f;
}

/* ============ 导航 ============ */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.nav-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
}
.brand-icon { font-size: 20px; }
.nav-actions { display: flex; align-items: center; gap: 16px; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  transition: background 0.2s;
}
.user-chip:hover { background: rgba(0, 0, 0, 0.05); }
.user-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
}
.user-avatar-img {
  width: 28px; height: 28px;
  border-radius: 50%;
  object-fit: cover;
}
.user-name { font-size: 14px; }

/* ============ 主体 ============ */
.main {
  max-width: 1160px;
  margin: 0 auto;
  padding: 60px 32px 100px;
}

/* ============ Hero ============ */
.hero { margin-bottom: 40px; }
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 40px;
}
.hero-title {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin: 0 0 12px;
  color: #1d1d1f;
}
.gradient-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: 17px;
  color: #86868b;
  margin: 0;
}

/* 月份选择 */
.month-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border-radius: 999px;
  padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.month-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #86868b;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.month-btn:hover { background: rgba(0, 0, 0, 0.05); color: #1d1d1f; }
.month-picker input[type="month"] {
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
}

/* ============ 三卡片 ============ */
.overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.ov-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.ov-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.ov-card.income::before { background: linear-gradient(90deg, #34c759, #5ac8fa); }
.ov-card.expense::before { background: linear-gradient(90deg, #ff3b30, #ff9500); }
.ov-card.balance::before { background: linear-gradient(90deg, #0071e3, #af52de); }

.ov-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.1);
}

.ov-label {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 12px;
}
.ov-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 8px;
}
.ov-card.income .ov-value { color: #34c759; }
.ov-card.expense .ov-value { color: #ff3b30; }
.ov-card.balance .ov-value { color: #0071e3; }
.ov-card.balance .ov-value.negative { color: #ff3b30; }

.ov-count {
  font-size: 12px;
  color: #c7c7cc;
}

/* ============ 图表 ============ */
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 40px 0;
}
.chart-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.chart-head h3 {
  font-size: 17px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.02em;
}
.chart-sub {
  font-size: 12px;
  color: #86868b;
}
.chart-empty {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #86868b;
  gap: 12px;
}
.chart-empty .empty-icon { font-size: 48px; }

/* ============ 账单列表 ============ */
.bills-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.bills-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.bills-head h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: #0071e3;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.add-btn:hover { background: #0077ed; transform: scale(1.02); }
.add-btn span:first-child { font-size: 16px; font-weight: 600; }

.bills-list { min-height: 200px; }

.bill-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.2s;
}
.bill-item:last-child { border-bottom: none; }
.bill-item:hover { background: rgba(0, 0, 0, 0.015); margin: 0 -16px; padding-left: 16px; padding-right: 16px; border-radius: 12px; }

.bill-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 59, 48, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.bill-icon.income {
  background: rgba(52, 199, 89, 0.1);
}

.bill-info { flex: 1; min-width: 0; }
.bill-cat {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 4px;
}
.bill-remark {
  font-size: 13px;
  color: #86868b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bill-date { color: #c7c7cc; }

.bill-amount {
  font-size: 17px;
  font-weight: 700;
  color: #ff3b30;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.bill-amount.income { color: #34c759; }

.bill-del {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #d1d1d6;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.bill-del:hover { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }

/* 空状态 */
.empty {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 6px;
}
.empty-desc { font-size: 14px; color: #86868b; }

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  font-size: 14px;
  color: #86868b;
}
.pagination button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}
.pagination button:hover:not(:disabled) { background: rgba(0, 113, 227, 0.06); border-color: #0071e3; color: #0071e3; }
.pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

/* ============ 弹窗 ============ */
.dialog-form { display: flex; flex-direction: column; gap: 20px; }

.type-switch {
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  padding: 4px;
  border-radius: 12px;
}
.type-switch button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  color: #86868b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: inherit;
}
.type-switch button.active {
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: #fbfbfd;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.amount-input .currency {
  font-size: 28px;
  color: #86868b;
  font-weight: 300;
}
.amount-input input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}
.amount-input input::placeholder { color: #d1d1d6; }

.field { display: flex; flex-direction: column; gap: 8px; }
.field label {
  font-size: 13px;
  color: #86868b;
  font-weight: 500;
}
.field input {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  font-size: 14px;
  color: #1d1d1f;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.field input:focus { border-color: #0071e3; }

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.cat-btn {
  padding: 10px 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: inherit;
}
.cat-btn:hover { border-color: #0071e3; }
.cat-btn.active {
  border-color: #0071e3;
  background: rgba(0, 113, 227, 0.06);
}
.cat-icon { font-size: 18px; }
.cat-name {
  font-size: 12px;
  color: #1d1d1f;
  font-weight: 500;
}

.dialog-btn {
  padding: 8px 24px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.dialog-btn.cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
}
.dialog-btn.cancel:hover { background: rgba(0, 0, 0, 0.08); }
.dialog-btn.primary {
  background: #0071e3;
  color: #fff;
}
.dialog-btn.primary:hover { background: #0077ed; }

/* ============ 响应式 ============ */
@media (max-width: 980px) {
  .charts { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .nav-inner { padding: 12px 16px; }
  .user-name { display: none; }
  .main { padding: 32px 16px 60px; }
  .hero-top { flex-direction: column; gap: 16px; }
  .hero-title { font-size: 28px; }
  .hero-subtitle { font-size: 15px; }
  .overview { grid-template-columns: 1fr; gap: 12px; }
  .ov-card { padding: 20px; border-radius: 16px; }
  .ov-value { font-size: 26px; }
  .charts { gap: 16px; margin: 24px 0; }
  .chart-card { padding: 16px; border-radius: 16px; }
  .bills-card { padding: 16px; border-radius: 16px; }
  .bill-item { gap: 12px; padding: 14px 0; }
  .bill-icon { width: 40px; height: 40px; font-size: 20px; }
  .bill-amount { font-size: 15px; }
  .category-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
