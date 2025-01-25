<script lang="ts">
import { defineComponent } from 'vue'
import GenderSelector from './components/GenderSelector.vue'
import NameFilters from './components/NameFilters.vue'
import NamesList from './components/NamesList.vue'

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
  components: {
    GenderSelector,
    NameFilters,
    NamesList
  },
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
      <p class="info-text">Neoficiální seznam jmen dětí narozených po roce 2000.</p>
      <p class="info-text"><em>Poznámka: Nejedná se o kompletní seznam všech českých jmen. K dispozici jsou pouze data zvěřejněná Českým Statistickým Úřadem.</em></p>
    </div>

    <div v-if="isLoading" class="loading">
      Načítání jmen...
    </div>

    <template v-else>
      <GenderSelector v-model="selectedGender" />

      <NameFilters
        v-if="selectedGender"
        v-model:filters="filters"
        :available-years="availableYears"
      />

      <NamesList
        v-if="selectedGender"
        :names="displayedNames"
        :gender="selectedGender"
        :show-rank="filters.sortBy === 'rank'"
      />
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

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}
</style>
