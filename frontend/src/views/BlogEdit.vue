<template>
  <div class="edit-wrap">
    <div class="header">
      <el-button size="small" @click="$router.back()">← 返回</el-button>
      <h2>{{ isEdit ? '编辑文章' : '写文章' }}</h2>
      <div>
        <el-button @click="onSave(0)">存草稿</el-button>
        <el-button type="primary" @click="onSave(1)">发布</el-button>
      </div>
    </div>

    <el-card>
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="给文章起个标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如：技术 / 生活 / 随笔" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple filterable allow-create default-first-option placeholder="输入后回车创建标签" style="width: 100%">
            <el-option v-for="t in tagOptions" :key="t.id" :label="t.name" :value="t.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <MdEditor v-model="form.content" style="height: 500px" :preview="true" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { getArticle, createArticle, updateArticle, getTags } from '@/api/article';

const route = useRoute();
const router = useRouter();
const isEdit = ref(false);
const tagOptions = ref([]);

const form = reactive({
  title: '',
  content: '',
  category: '',
  tags: []
});

async function onSave(status) {
  if (!form.title.trim()) return ElMessage.warning('请输入标题');
  if (!form.content.trim()) return ElMessage.warning('请输入内容');

  try {
    const payload = { ...form, status };
    if (isEdit.value) {
      await updateArticle(route.params.id, payload);
      ElMessage.success('更新成功');
    } else {
      const res = await createArticle(payload);
      ElMessage.success('发布成功');
      router.push(`/article/${res.id}`);
      return;
    }
    router.push(`/article/${route.params.id}`);
  } catch (e) {}
}

onMounted(async () => {
  tagOptions.value = await getTags();
  if (route.params.id) {
    isEdit.value = true;
    const data = await getArticle(route.params.id);
    form.title = data.title;
    form.content = data.content;
    form.category = data.category;
    form.tags = data.tags?.map(t => t.name) || [];
  }
});
</script>

<style scoped>
.edit-wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
