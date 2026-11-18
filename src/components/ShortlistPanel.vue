<template>
  <div class="shortlist">
    <div class="shortlist-body">
      <ol ref="list" class="shortlist-items">
        <li v-for="(name, i) in names" :key="name" :data-name="name">
          <span class="handle" title="Přetáhněte pro změnu pořadí" aria-hidden="true">⠿</span>
          <span class="position">{{ i + 1 }}.</span>
          <span class="name">{{ name }}</span>
          <button
            type="button"
            class="remove"
            :aria-label="`Odebrat ${name}`"
            @click="$emit('update:names', names.filter(n => n !== name))"
          >×</button>
        </li>
      </ol>
      <p v-if="names.length === 0" class="empty">
        {{ dropHint ? 'Přetáhněte sem jména nebo klikněte na ♡' : 'Klikněte na ♡ u jména' }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Sortable from 'sortablejs'
import { insertAt, move } from '../shortlist'

export default defineComponent({
  name: 'ShortlistPanel',
  props: {
    names: { type: Array as PropType<string[]>, required: true },
    dropHint: { type: Boolean, default: true }
  },
  emits: ['update:names'],
  data() {
    return { sortable: null as Sortable | null }
  },
  mounted() {
    this.sortable = Sortable.create(this.$refs.list as HTMLElement, {
      group: { name: 'names', put: true },
      handle: '.handle',
      animation: 150,
      onUpdate: (evt) => {
        const { item, oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined) return
        // Undo Sortable's DOM move; Vue re-renders from the new array.
        const parent = item.parentNode!
        parent.removeChild(item)
        parent.insertBefore(item, parent.children[oldIndex] ?? null)
        this.$emit('update:names', move(this.names, oldIndex, newIndex))
      },
      onAdd: (evt) => {
        const { item, clone, newIndex } = evt
        const name = item.dataset.name
        // Put the dragged grid tile back where the grid's clone stands in for it.
        if (clone?.parentNode) clone.replaceWith(item)
        else item.remove()
        if (name && newIndex !== undefined) {
          this.$emit('update:names', insertAt(this.names, name, newIndex))
        }
      }
    })
  },
  beforeUnmount() {
    this.sortable?.destroy()
  }
})
</script>

<style scoped>
.shortlist-body {
  position: relative;
}

.shortlist-items {
  list-style: none;
  margin: 0;
  padding: 0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortlist-items li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #333;
}

/* A grid tile dropped in shows briefly before Vue re-renders. */
.shortlist-items li.sortable-ghost {
  opacity: 0.5;
  background-color: #fde7ef;
}

.handle {
  cursor: grab;
  color: #9ca3af;
  font-size: 1.1rem;
  padding: 4px 2px;
  touch-action: none;
  user-select: none;
}

.position {
  color: #6b7280;
  min-width: 1.6em;
  font-variant-numeric: tabular-nums;
}

.name {
  flex: 1;
  font-weight: 600;
}

.remove {
  border: none;
  background: none;
  color: #9ca3af;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
}

.remove:hover {
  color: #dc2626;
}

.empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  pointer-events: none;
}
</style>
