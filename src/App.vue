<script lang="ts">
import { defineComponent } from 'vue'

interface NameItem {
  name: string
  rank: string
}

interface YearData {
  male: Record<string, string>
  female: Record<string, string>
}

interface NamesByYear {
  [key: string]: YearData
}

export default defineComponent({
  name: 'App',
  data() {
    return {
      selectedGender: null as 'male' | 'female' | null,
      maleNames: [] as string[],
      femaleNames: [] as string[],
      isLoading: true,
      filters: {
        year: '',
        sortBy: 'alpha' as 'alpha' | 'rank',
        searchText: '',
        includePluralNames: true
      },
      availableYears: [] as string[],
      namesByYear: {} as NamesByYear,
      displayedItems: [] as NameItem[]
    }
  },
  computed: {
    displayedNames(): NameItem[] {
      if (!this.selectedGender) return []
      
      let names = this.selectedGender === 'male' ? this.maleNames : this.femaleNames
      
      // Apply text filter
      if (this.filters.searchText) {
        const searchTerm = this.filters.searchText.toUpperCase()
        names = names.filter(name => name.includes(searchTerm))
      }

      // Filter by year (for both sorting methods)
      if (this.filters.year) {
        const yearData = this.namesByYear[this.filters.year]?.[this.selectedGender] || {}
        names = names.filter(name => yearData[name])
      }

      // Filter plural names
      if (!this.filters.includePluralNames) {
        names = names.filter(name => !name.includes(' '))
      }

      // If sorting by rank
      if (this.filters.year && this.filters.sortBy === 'rank') {
        const yearData = this.namesByYear[this.filters.year]?.[this.selectedGender] || {}
        return names
          .map(name => ({
            name,
            rank: yearData[name] || ''
          }))
          .sort((a, b) => {
            const rankA = parseInt(a.rank.split('-')[0])
            const rankB = parseInt(b.rank.split('-')[0])
            return rankA - rankB
          })
      } else {
        // Alphabetical sorting
        return names.sort().map(name => ({ name, rank: '' }))
      }
    }
  },
  methods: {
    async loadCSV(filePath: string): Promise<string[]> {
      try {
        const response = await fetch(filePath)
        const text = await response.text()
        const year = filePath.match(/\/(\d{4})\.csv$/)?.[1]
        
        if (year && !this.namesByYear[year]) {
          this.namesByYear[year] = { male: {}, female: {} }
        }

        const names = text.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [rank, name] = line.split(',').map(item => item.trim())
            if (name) {
              const upperName = name.toUpperCase()
              // Store rank information
              if (year) {
                const gender = filePath.includes('/data/boys/') ? 'male' : 'female'
                this.namesByYear[year][gender][upperName] = rank
              }
              return upperName
            }
            return null
          })
          .filter((name): name is string => name !== null)

        return names
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error)
        return []
      }
    },

    async loadAllNames() {
      try {
        const years = new Set<string>()
        
        // Check years from 2000 to current year
        for (let year = 2000; year <= new Date().getFullYear(); year++) {
          const boysPath = `/data/boys/${year}.csv`
          const girlsPath = `/data/girls/${year}.csv`
          
          try {
            const [boysResponse, girlsResponse] = await Promise.all([
              fetch(boysPath),
              fetch(girlsPath)
            ])

            // Check if responses are CSV files by looking at content-type or first line
            const isCSV = async (response: Response) => {
              const text = await response.text()
              // Check if the content looks like CSV (contains a comma and starts with a number)
              return /^\d+,/.test(text.trim())
            }

            const [hasBoysFile, hasGirlsFile] = await Promise.all([
              isCSV(boysResponse),
              isCSV(girlsResponse)
            ])

            if (hasBoysFile || hasGirlsFile) {
              years.add(year.toString())
            }
          } catch (e) {
            // Skip if file doesn't exist or there's an error
            continue
          }
        }

        if (years.size === 0) {
          throw new Error('No data files found')
        }

        this.availableYears = [...years].sort((a, b) => parseInt(b) - parseInt(a))

        // Load boys names
        const boysPromises = this.availableYears.map(year => 
          this.loadCSV(`/data/boys/${year}.csv`)
        )
        const boysNamesArrays = await Promise.all(boysPromises)
        const boysSet = new Set(boysNamesArrays.flat())
        this.maleNames = [...boysSet]

        // Load girls names
        const girlsPromises = this.availableYears.map(year => 
          this.loadCSV(`/data/girls/${year}.csv`)
        )
        const girlsNamesArrays = await Promise.all(girlsPromises)
        const girlsSet = new Set(girlsNamesArrays.flat())
        this.femaleNames = [...girlsSet]

        this.isLoading = false
      } catch (error) {
        console.error('Error loading names:', error)
        this.isLoading = false
      }
    }
  },
  mounted() {
    this.loadAllNames()
  }
})
</script>

<template>
  <div class="app-container">
    <div class="info-section">
      <h1>Databáze českých jmen</h1>
      <p class="info-text">Prozkoumejte česká jména dávaná novorozencům od roku 2000.</p>
      <p class="info-text"><em>Poznámka: Nejedná se o kompletní seznam všech českých jmen, ale o sbírku jmen běžně používaných pro novorozence v posledních desetiletích.</em></p>
    </div>

    <div v-if="isLoading" class="loading">
      Načítání jmen...
    </div>

    <template v-else>
      <div class="gender-selection">
        <div 
          class="gender-card male"
          :class="{ active: selectedGender === 'male' }"
          @click="selectedGender = 'male'"
        >
          <i class="fas fa-mars"></i>
          <h2>CHLAPCI</h2>
        </div>
        <div 
          class="gender-card female"
          :class="{ active: selectedGender === 'female' }"
          @click="selectedGender = 'female'"
        >
          <i class="fas fa-venus"></i>
          <h2>DÍVKY</h2>
        </div>
      </div>

      <div v-if="selectedGender" class="filters">
        <div class="filters-row">
          <div class="filter-group">
            <label for="year">Rok</label>
            <select id="year" v-model="filters.year">
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
              v-model="filters.sortBy"
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
              v-model="filters.searchText" 
              placeholder="Filtrovat jména..."
            >
          </div>

          <div class="filter-group checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="filters.includePluralNames"
              >
              <span class="checkbox-text">Včetně víceslovných jmen</span>
            </label>
          </div>
        </div>
      </div>

      <div class="names-list" v-if="selectedGender">
        <h3>Jména pro {{ selectedGender === 'male' ? 'chlapce' : 'dívky' }}</h3>
        <ul>
          <li v-for="item in displayedNames" :key="item.name">
            <span v-if="filters.sortBy === 'rank'" class="rank">{{ item.rank }}</span>
            {{ item.name }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
}

#app {
  width: 100%;
  display: flex;
  justify-content: center;
}

.app-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.info-section {
  text-align: center;
  margin-bottom: 40px;
}

.info-text {
  color: #666;
  margin: 10px 0;
}

.gender-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

.gender-card {
  flex: 1;
  padding: 40px;
  text-align: center;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.gender-card:hover {
  transform: translateY(-5px);
}

.gender-card.active {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.gender-card i {
  font-size: 48px;
  margin-bottom: 20px;
}

.male {
  background-color: #e3f2fd;
  color: #1565c0;
}

.male.active {
  background-color: #bbdefb;
}

.female {
  background-color: #fce4ec;
  color: #c2185b;
}

.female.active {
  background-color: #f8bbd0;
}

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

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}

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

/* Mobile responsive styles */
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
