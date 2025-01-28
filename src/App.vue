<script lang="ts">
import { defineComponent } from 'vue'
import GenderSelector from './components/GenderSelector.vue'
import NameFilters from './components/NameFilters.vue'
import NamesList from './components/NamesList.vue'
import Footer from './components/Footer.vue'

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
    NamesList,
    Footer
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

      // If sorting by rank (only available when specific year is selected)
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
        return names
          .map(name => ({ name, rank: '' }))
          .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
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
            if (year) {
              // For year-specific files that include rank
              const [rank, name] = line.split(',').map(item => item.trim())
              if (name) {
                const upperName = name.toUpperCase()
                // Store rank information
                const gender = filePath.includes('/boys/') ? 'male' : 'female'
                this.namesByYear[year][gender][upperName] = rank
                return upperName
              }
            } else {
              // For general name lists without rank
              const name = line.trim()
              if (name) {
                return name.toUpperCase()
              }
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
        
        // Load general name lists first
        const [boysNames, girlsNames] = await Promise.all([
          this.loadCSV('/data/boys.csv'),
          this.loadCSV('/data/girls.csv')
        ])
        
        this.maleNames = boysNames
        this.femaleNames = girlsNames

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
            continue
          }
        }

        if (years.size === 0) {
          throw new Error('No data files found')
        }

        this.availableYears = [...years].sort((a, b) => parseInt(b) - parseInt(a))

        // Load year-specific data
        const boysPromises = this.availableYears.map(year => 
          this.loadCSV(`/data/boys/${year}.csv`)
        )
        await Promise.all(boysPromises)

        const girlsPromises = this.availableYears.map(year => 
          this.loadCSV(`/data/girls/${year}.csv`)
        )
        await Promise.all(girlsPromises)

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
      <h1>Jména v České Republice</h1>
      <p class="info-text">Neoficiální seznam jmen dětí narozených po roce 2000 a kompletní seznam jmen, které lze v ČR použít.</p>
      <p class="info-text"><em>Poznámka: Kompletní seznam jmen (Všechny roky) byl stažen ze stránek Ministerstva vnitra. Roční seznamy jmen a jejich oblíbenost jsou vytvořeny z dat Českého statistického úřadu.</em></p>
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

    <Footer />
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
  color: #c6c2c2;
  margin: 10px 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}
</style>
