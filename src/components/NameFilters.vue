<template>
  <div class="filters">
    <div class="filters-row">
      <div class="filter-group">
        <label for="year">Rok</label>
        <select 
          id="year" 
          :value="filters.year"
          @input="updateFilter('year', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Všechny roky</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="sort">Řazení</label>
        <select 
          id="sort" 
          :value="filters.sortBy"
          @input="updateFilter('sortBy', ($event.target as HTMLSelectElement).value)"
          :title="!filters.year && filters.sortBy === 'rank' ? 'Pro řazení podle pořadí nejdříve vyberte rok' : ''"
        >
          <option value="alpha">Abecedně</option>
          <option value="rank" :disabled="!filters.year">
            Podle pořadí {{ !filters.year ? '(nejdříve vyberte rok)' : '' }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="search">Hledat</label>
        <input 
          id="search" 
          type="text" 
          :value="filters.searchText"
          @input="updateFilter('searchText', ($event.target as HTMLInputElement).value)"
          placeholder="Filtrovat jména..."
        >
      </div>

      <div class="filter-group checkbox-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            :checked="filters.includePluralNames"
            @change="updateFilter('includePluralNames', ($event.target as HTMLInputElement).checked)"
          >
          <span class="checkbox-text">Včetně víceslovných jmen</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface Filters {
  year: string
  sortBy: 'alpha' | 'rank'
  searchText: string
  includePluralNames: boolean
}

export default defineComponent({
  name: 'NameFilters',
  props: {
    filters: {
      type: Object as PropType<Filters>,
      required: true
    },
    availableYears: {
      type: Array as PropType<string[]>,
      required: true
    }
  },
  emits: ['update:filters'],
  methods: {
    updateFilter(key: keyof Filters, value: any) {
      this.$emit('update:filters', {
        ...this.filters,
        [key]: value
      })
    }
  }
})
</script>

<style scoped>
.filters {
  width: 100%;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.filters-row {
  display: flex;
  flex-direction: row;
  gap: 24px;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  flex: 1;
  min-width: 120px;
}

.filter-group label {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-group select,
.filter-group input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: white;
  font-size: 0.9rem;
  color: #374151;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.filter-group select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}

.filter-group select:hover,
.filter-group input[type="text"]:hover {
  border-color: #d1d5db;
}

.filter-group select:focus,
.filter-group input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-group {
  flex: 0.8;
  min-width: auto;
  display: flex;
  align-items: center;
  margin-top: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  padding: 4px 0;
}

.checkbox-label input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  background-color: white;
  vertical-align: middle;
}

.checkbox-label input[type="checkbox"]:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-label input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 0.9rem;
  color: #374151;
  vertical-align: middle;
  padding-left: 5px;
}

select[disabled] {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .filters {
    padding: 16px;
    margin: 20px auto;
  }

  .filters-row {
    flex-direction: column;
    gap: 16px;
  }

  .filter-group {
    width: 100%;
  }

  .checkbox-group {
    margin-top: 8px;
    justify-content: flex-start;
  }
}
</style> 