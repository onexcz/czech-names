<template>
  <footer class="footer">
    <a href="mailto:seznamjmen@gmail.com" class="email-link">seznamjmen@gmail.com</a>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Footer'
})
</script>

<style scoped>
.footer {
  margin-top: 60px;
  padding: 20px;
  text-align: center;
  border-top: 1px solid #eee;
}

.email-link {
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
}

.email-link:hover {
  color: #3b82f6;
  text-decoration: underline;
}
</style> 