<template>
  <div class="shortlist">
    <div class="shortlist-body">
      <ol ref="list" class="shortlist-items">
        <li v-for="(name, i) in names" :key="name" :data-name="name" :class="{ flash: flashName === name }">
          <span class="handle" title="Přetáhněte pro změnu pořadí" aria-hidden="true">⠿</span>
          <span class="position">{{ i + 1 }}.</span>
          <span class="name">
            {{ name }}
            <span v-if="!known.has(name)" class="custom" title="Vlastní jméno">✎</span>
          </span>
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

    <form class="add-form" @submit.prevent="addTyped">
      <input
        v-model="typed"
        type="text"
        :maxlength="maxLength"
        placeholder="Vlastní jméno…"
        aria-label="Přidat vlastní jméno"
        :class="{ invalid: typedInvalid }"
        @input="typedInvalid = false"
      >
      <button type="submit" aria-label="Přidat do oblíbených">+</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Sortable from 'sortablejs'
import { MAX_NAME_LENGTH, append, insertAt, move, normalizeName } from '../shortlist'

export default defineComponent({
  name: 'ShortlistPanel',
  props: {
    names: { type: Array as PropType<string[]>, required: true },
    dropHint: { type: Boolean, default: true },
    /** Names that exist in the data; anything else is marked as the user's own. */
    known: { type: Object as PropType<Set<string>>, default: () => new Set<string>() }
  },
  emits: ['update:names'],
  data() {
    return {
      sortable: null as Sortable | null,
      typed: '',
      typedInvalid: false,
      flashName: '',
      flashTimer: 0,
      maxLength: MAX_NAME_LENGTH
    }
  },
  mounted() {
    this.sortable = Sortable.create(this.$refs.list as HTMLElement, {
      group: { name: 'names', put: true },
      handle: '.handle',
      animation: 150,
      // Mouse/touch-event dragging instead of native HTML5 DnD: same feel everywhere.
      forceFallback: true,
      fallbackOnBody: true,
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
    clearTimeout(this.flashTimer)
  },
  methods: {
    addTyped() {
      const name = normalizeName(this.typed)
      if (!name) {
        this.typedInvalid = this.typed.trim() !== ''
        return
      }
      this.typed = ''
      if (this.names.includes(name)) this.flash(name)
      else this.$emit('update:names', append(this.names, name))
    },
    flash(name: string) {
      clearTimeout(this.flashTimer)
      this.flashName = name
      this.flashTimer = window.setTimeout(() => { this.flashName = '' }, 1200)
    }
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

.custom {
  color: #9ca3af;
  font-weight: normal;
  margin-left: 4px;
}

.shortlist-items li.flash {
  animation: flash 1.2s ease;
}

@keyframes flash {
  0%, 40% { background-color: #fde68a; border-color: #f59e0b; }
  100% { background-color: #fff; }
}

.add-form {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.add-form input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #fff;
  color: #333;
  font-size: 0.9rem;
}

.add-form input:focus {
  outline: none;
  border-color: #be185d;
}

.add-form input.invalid {
  border-color: #dc2626;
}

.add-form button {
  width: 38px;
  border: none;
  border-radius: 6px;
  background-color: #be185d;
  color: #fff;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}

.add-form button:hover {
  background-color: #9d174d;
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
