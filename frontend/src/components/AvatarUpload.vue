<template>
  <div class="avatar-upload">
    <div class="avatar-preview" @click="triggerSelect">
      <img v-if="modelValue" :src="modelValue" alt="avatar" />
      <div v-else class="avatar-placeholder">{{ placeholderChar }}</div>
      <div class="avatar-overlay"><span>📷</span></div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFileChange" />
    <div class="avatar-tip">点击更换头像（最大 20MB）</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { uploadFile } from '@/api/upload';

const props = defineProps({
  modelValue: { type: String, default: '' },
  username: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);
const fileInput = ref(null);

const placeholderChar = computed(() =>
  props.username ? props.username[0].toUpperCase() : '?'
);

function triggerSelect() { fileInput.value?.click(); }

async function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件太大，最大 20MB');
    e.target.value = '';
    return;
  }
  try {
    const { url } = await uploadFile('avatar', file);
    emit('update:modelValue', url);
    ElMessage.success('头像上传成功');
  } catch (err) {
    ElMessage.error(err.message || '上传失败');
  }
  e.target.value = '';
}
</script>

<style scoped>
.avatar-upload { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.avatar-preview { position: relative; width: 100px; height: 100px; border-radius: 50%; overflow: hidden; cursor: pointer; border: 3px solid #fff; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2); transition: transform 0.2s; }
.avatar-preview:hover { transform: scale(1.05); }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 600; }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; font-size: 24px; }
.avatar-preview:hover .avatar-overlay { opacity: 1; }
.avatar-tip { font-size: 12px; color: #909399; }
</style>
