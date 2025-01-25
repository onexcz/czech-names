<template>
  <div class="names-list">
    <h3>Jména pro {{ gender === 'male' ? 'chlapce' : 'dívky' }}</h3>
    <ul>
      <li v-for="item in names" :key="item.name">
        <span v-if="showRank" class="rank">{{ item.rank }}</span>
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface NameItem {
  name: string
  rank: string
}

export default defineComponent({
  name: 'NamesList',
  props: {
    names: {
      type: Array as PropType<NameItem[]>,
      required: true
    },
    gender: {
      type: String as PropType<'male' | 'female'>,
      required: true
    },
    showRank: {
      type: Boolean,
      required: true
    }
  }
})
</script>

<style scoped>
.names-list {
  max-width: 600px;
  margin: 0 auto;
  padding-top: 20px;
}

.names-list h3 {
  text-align: center;
  margin-bottom: 20px;
}

.names-list ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.names-list li {
  padding: 10px;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 5px;
  color: #333;
  border: 1px solid #ddd;
}

.rank {
  margin-right: 5px;
  color: #666;
}
</style> 