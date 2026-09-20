import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
  { path: '/board', component: () => import('@/views/MessageBoard.vue'), meta: { title: '留言板' } },
  { path: '/todo', component: () => import('@/views/TodoList.vue'), meta: { title: '待办清单' } },
  { path: '/blog', component: () => import('@/views/BlogList.vue'), meta: { title: '博客' } },
  { path: '/article/edit/:id?', component: () => import('@/views/BlogEdit.vue'), meta: { title: '写文章' } },
  { path: '/article/:id', component: () => import('@/views/BlogDetail.vue'), meta: { title: '文章详情' } },
  { path: '/accounting', component: () => import('@/views/Accounting.vue'), meta: { title: '记账本' } },
  { path: '/chat', component: () => import('@/views/Chat.vue'), meta: { title: '即时聊天' } },
  { path: '/profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人资料' } },
  { path: '/pet', component: () => import('@/views/Pet.vue'), meta: { title: '我的宠物' } },
  { path: '/pet/achievements', component: () => import('@/views/PetAchievements.vue'), meta: { title: '成就墙' } },
  { path: '/pet/friends', component: () => import('@/views/PetFriends.vue'), meta: { title: '好友' } },
  { path: '/pet/decorations', component: () => import('@/views/PetDecorations.vue'), meta: { title: '装扮' } },
  { path: '/pet/tombstone', component: () => import('@/views/PetTombstone.vue'), meta: { title: '宠物墓地' } },
  { path: '/pet/chat', component: () => import('@/views/PetChat.vue'), meta: { title: '和宠物聊天' } },
  { path: '/pet/diary', component: () => import('@/views/PetDiary.vue'), meta: { title: '宠物日记' } },
  { path: '/pet/style', component: () => import('@/views/PetStyle.vue'), meta: { title: '宠物风格' } },
  { path: '/pet/friend/:petId', component: () => import('@/views/PetFriendDetail.vue'), meta: { title: '好友的宠物' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) return next('/login');
  next();
});

router.afterEach((to) => {
  document.title = (to.meta.title ? to.meta.title + ' - ' : '') + '猫狗回忆录';
});

export default router;
