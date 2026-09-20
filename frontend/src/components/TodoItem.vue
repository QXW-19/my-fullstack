<template>
  <div class="todo-item" :class="{ done: todo.status === 1 }">
    <el-checkbox
      :model-value="todo.status === 1"
      @change="onToggle"
    />
    <div class="content">
      <div class="title">
        <span class="priority" :class="`p${todo.priority}`">
          {{ ['低', '中', '高'][todo.priority] }}
        </span>
        <span>{{ todo.title }}</span>
      </div>
      <div class="meta">
        <el-tag v-if="todo.category" size="small">{{ todo.category }}</el-tag>
        <span v-if="todo.due_date" class="time">📅 {{ formatDate(todo.due_date) }}</span>
      </div>
    </div>
    <el-button size="small" text type="danger" @click="onDelete">删除</el-button>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTodoStore } from '@/stores/todo';

const props = defineProps({ todo: { type: Object, required: true } });
const todoStore = useTodoStore();

function formatDate(t) {
  return new Date(t).toLocaleDateString('zh-CN');
}

function onToggle() {
  todoStore.toggle(props.todo);
}

async function onDelete() {
  try {
    await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' });
    await todoStore.remove(props.todo.id);
    ElMessage.success('删除成功');
  } catch (e) {}
}
</script>

<style scoped>
.todo-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}
.todo-item:hover { background: #fafafa; }
.todo-item.done .title span:last-child {
  text-decoration: line-through;
  color: #999;
}
.content { flex: 1; }
.title { font-size: 15px; display: flex; align-items: center; gap: 8px; }
.priority {
  font-size: 11px; padding: 1px 6px; border-radius: 3px;
  color: #fff;
}
.priority.p0 { background: #67c23a; }
.priority.p1 { background: #e6a23c; }
.priority.p2 { background: #f56c6c; }
.meta { margin-top: 4px; display: flex; gap: 8px; align-items: center; font-size: 12px; color: #999; }
</style>
