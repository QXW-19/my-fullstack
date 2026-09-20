<template>
  <div class="profile-wrap">
    <div class="profile-header">
      <el-button size="small" @click="$router.push('/home')">🏠 首页</el-button>
      <h2>个人资料</h2>
      <span></span>
    </div>

    <!-- ========== 头像 + 基本信息 ========== -->
    <el-card class="profile-card">
      <AvatarUpload v-model="avatar" :username="userStore.userInfo?.username" />
      <el-divider />
      <el-form label-width="80px" style="max-width: 400px; margin: 0 auto">
        <el-form-item label="用户名">
          <el-input :model-value="userStore.userInfo?.username" disabled />
        </el-form-item>
        <el-form-item label="用户 ID">
          <el-input :model-value="userStore.userInfo?.id" disabled />
        </el-form-item>
      </el-form>
      <div style="text-align: center; margin-top: 24px">
        <el-button type="primary" :loading="saving" @click="onSaveAvatar">保存头像</el-button>
      </div>
    </el-card>

    <!-- ========== 邮箱设置 ========== -->
    <el-card class="email-card">
      <template #header>
        <div class="card-header">
          <span>📧 邮箱通知</span>
          <el-tag v-if="emailForm.email" type="success" size="small">已绑定</el-tag>
          <el-tag v-else type="info" size="small">未绑定</el-tag>
        </div>
      </template>

      <el-form label-width="80px" style="max-width: 400px; margin: 0 auto">
        <el-form-item label="邮箱">
          <el-input
            v-model="emailForm.email"
            placeholder="如：your@qq.com"
            clearable
          />
        </el-form-item>

        <el-form-item label="通知">
          <el-switch
            v-model="emailForm.email_notify"
            active-text="接收邮件通知"
            inactive-text="关闭"
          />
        </el-form-item>

        <el-alert
          v-if="emailForm.email"
          title="📬 我们会发送以下邮件"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        >
          <div style="font-size: 13px; line-height: 1.8;">
            · 💬 有人回复了你的留言<br/>
            · 😿 宠物饿了需要喂食<br/>
            · 💀 宠物死亡提醒<br/>
            · ❤️ 好友帮助了你的宠物
          </div>
        </el-alert>

        <div style="text-align: center; margin-top: 24px">
          <el-button @click="onTestEmail" :disabled="!emailForm.email" :loading="testing">
            发送测试邮件
          </el-button>
          <el-button type="primary" @click="onSaveEmail" :loading="savingEmail">
            保存
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getEmail, updateEmail, sendTestEmail } from '@/api/user';
import AvatarUpload from '@/components/AvatarUpload.vue';

const userStore = useUserStore();

const avatar = ref('');
const saving = ref(false);

const emailForm = reactive({
  email: '',
  email_notify: true
});
const savingEmail = ref(false);
const testing = ref(false);

// ========== 头像保存 ==========
async function onSaveAvatar() {
  if (!avatar.value) return ElMessage.warning('请先上传头像');
  saving.value = true;
  userStore.updateAvatar(avatar.value);
  await new Promise(r => setTimeout(r, 300));
  saving.value = false;
  ElMessage.success('头像保存成功');
}

// ========== 加载邮箱 ==========
async function loadEmail() {
  try {
    const data = await getEmail();
    emailForm.email = data.email || '';
    emailForm.email_notify = data.email_notify !== false;
  } catch (e) {}
}

// ========== 保存邮箱 ==========
async function onSaveEmail() {
  if (emailForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
    return ElMessage.error('邮箱格式不正确');
  }

  savingEmail.value = true;
  try {
    await updateEmail({
      email: emailForm.email,
      email_notify: emailForm.email_notify
    });
    ElMessage.success('保存成功');
  } catch (e) {
    ElMessage.error(e.message);
  }
  savingEmail.value = false;
}

// ========== 测试邮件 ==========
async function onTestEmail() {
  testing.value = true;
  try {
    await sendTestEmail();
    ElMessage.success('测试邮件已发送，请查收（含垃圾箱）');
  } catch (e) {
    ElMessage.error(e.message);
  }
  testing.value = false;
}

onMounted(async () => {
  avatar.value = userStore.userInfo?.avatar || '';
  await loadEmail();
});
</script>

<style scoped>
.profile-wrap { max-width: 600px; margin: 0 auto; padding: 24px; }
.profile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.profile-header h2 { margin: 0; }
.profile-card { text-align: center; padding: 24px 0; margin-bottom: 20px; }
.email-card { padding: 8px 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
