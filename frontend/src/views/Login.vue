<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2 style="text-align:center">{{ isLogin ? '登录' : '注册' }}</h2>
      <el-form :model="form" label-width="0" style="margin-top:20px">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>

        <!-- ⭐ 注册时显示邮箱 -->
        <el-form-item v-if="!isLogin">
          <el-input v-model="form.email" placeholder="邮箱（可选，接收通知）" size="large" />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          style="width:100%"
          :loading="loading"
          @click="onSubmit"
        >
          {{ isLogin ? '登录' : '注册' }}
        </el-button>
      </el-form>
      <div style="text-align:center;margin-top:12px">
        <el-link type="primary" @click="isLogin = !isLogin">
          {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
        </el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const isLogin = ref(true);
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
  email: ''
});

async function onSubmit() {
  if (!form.username || !form.password) {
    return ElMessage.warning('请填写完整');
  }

  loading.value = true;
  try {
    if (isLogin.value) {
      await userStore.login({
        username: form.username,
        password: form.password
      });
      ElMessage.success('登录成功');
    } else {
      await userStore.register({
        username: form.username,
        password: form.password,
        email: form.email
      });
      ElMessage.success('注册成功');
    }
    router.push('/board');
  } catch (e) {
    // 错误已由 request 拦截器处理
  }
  loading.value = false;
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.login-card { width: 380px; padding: 20px; }
</style>
