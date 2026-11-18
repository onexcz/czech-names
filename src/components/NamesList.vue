<template>
  <div class="names-list">
    <h3>Jména pro {{ gender === 'male' ? 'chlapce' : 'dívky' }}</h3>
    <ul ref="grid" :class="{ draggable: dragEnabled }">
      <li
        v-for="item in names"
        :key="item.name"
        :data-name="item.name"
        :class="{ liked: likedSet.has(item.name) }"
      >
        <span class="label">
          <span v-if="showRank" class="rank">{{ item.rank }}</span>
          {{ item.name }}
        </span>
        <button
          type="button"
          class="heart"
          :aria-pressed="likedSet.has(item.name)"
          :aria-label="likedSet.has(item.name) ? `Odebrat ${item.name} z oblíbených` : `Přidat ${item.name} do oblíbených`"
          @click="$emit('toggle', item.name)"
        >{{ likedSet.has(item.name) ? '♥' : '♡' }}</button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Sortable from 'sortablejs'

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
    },
    liked: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    dragEnabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle'],
  data() {
    return { sortable: null as Sortable | null }
  },
  computed: {
    likedSet(): Set<string> {
      return new Set(this.liked)
    }
  },
  watch: {
    dragEnabled() {
      this.syncSortable()
    }
  },
  mounted() {
    this.syncSortable()
  },
  beforeUnmount() {
    this.sortable?.destroy()
  },
  methods: {
    // Grid is a drag source only: tiles are copied into the shortlist, never reordered here.
    syncSortable() {
      if (this.dragEnabled && !this.sortable) {
        this.sortable = Sortable.create(this.$refs.grid as HTMLElement, {
          group: { name: 'names', pull: 'clone', put: false },
          sort: false,
          forceFallback: true,
          fallbackOnBody: true,
          filter: '.heart',
          preventOnFilter: false
        })
      } else if (!this.dragEnabled && this.sortable) {
        this.sortable.destroy()
        this.sortable = null
      }
    }
  }
})
</script>

<style scoped>
.names-list {
  width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 6px 6px 6px 10px;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 5px;
  color: #333;
  border: 1px solid #ddd;
}

.names-list ul.draggable li {
  cursor: grab;
}

.names-list li.liked {
  background-color: #fde7ef;
  border-color: #f4a6c0;
}

.label {
  flex: 1;
  text-align: center;
}

.heart {
  border: none;
  background: none;
  color: #be185d;
  font-size: 1.15rem;
  line-height: 1;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 4px;
}

.heart:hover {
  background-color: rgba(190, 24, 93, 0.1);
}

.rank {
  margin-right: 5px;
  color: #666;
}
</style> 