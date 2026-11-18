<template>
  <div class="share-view">
    <h1>♥ Oblíbená jména</h1>
    <p class="subtitle">Sdílený seznam</p>

    <p v-if="sections.length === 0" class="empty">Seznam je prázdný.</p>

    <div v-else class="sections">
      <section v-for="section in sections" :key="section.title" class="section" :class="section.gender">
        <h2>{{ section.title }}</h2>
        <ol>
          <li v-for="(name, i) in section.names" :key="name">
            <span class="position">{{ i + 1 }}.</span>
            <span class="name">{{ name }}</span>
          </li>
        </ol>
      </section>
    </div>

    <a class="browse" href="/">Procházet jména →</a>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Shortlists } from '../shortlist'

export default defineComponent({
  name: 'ShareView',
  props: {
    lists: { type: Object as PropType<Shortlists>, required: true }
  },
  computed: {
    sections(): { gender: string, title: string, names: string[] }[] {
      return [
        { gender: 'female', title: 'Dívky', names: this.lists.female },
        { gender: 'male', title: 'Chlapci', names: this.lists.male }
      ].filter(s => s.names.length > 0)
    }
  }
})
</script>

<style scoped>
.share-view {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

h1 {
  color: #f4a6c0;
  margin-bottom: 4px;
}

.subtitle {
  color: #c6c2c2;
  margin-top: 0;
  margin-bottom: 32px;
}

.empty {
  color: #c6c2c2;
  margin: 40px 0;
}

.sections {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  text-align: left;
}

.section {
  flex: 1 1 240px;
  max-width: 300px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  color: #333;
}

.section h2 {
  margin: 0 0 12px;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section.female h2 {
  color: #be185d;
}

.section.male h2 {
  color: #1d4ed8;
}

ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.position {
  color: #6b7280;
  min-width: 1.6em;
  font-variant-numeric: tabular-nums;
}

.name {
  font-weight: 600;
}

.browse {
  display: inline-block;
  margin-top: 32px;
  padding: 10px 18px;
  border-radius: 8px;
  background-color: #be185d;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.browse:hover {
  background-color: #9d174d;
}
</style>
