<template>
  <div class="app-root">
    <router-view />
    <PetPhysics v-if="showPark" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PetPhysics from '@/components/PetPhysics.vue';

const route = useRoute();

const EXCLUDE_PATHS = [
  '/login',
  '/pet',
  '/pet/chat',
  '/pet/decorations',
  '/pet/achievements',
  '/pet/friends',
  '/pet/tombstone'
];

const showPark = computed(() => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  if (EXCLUDE_PATHS.includes(route.path)) return false;
  if (route.path.startsWith('/pet/friend/')) return false;
  return true;
});
</script>

<style>
.app-root { min-height: 100vh; }
</style>
