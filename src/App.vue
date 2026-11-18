<script lang="ts">
import { defineComponent } from 'vue'
import GenderSelector from './components/GenderSelector.vue'
import NameFilters from './components/NameFilters.vue'
import NamesList from './components/NamesList.vue'
import Footer from './components/Footer.vue'
import ShortlistPanel from './components/ShortlistPanel.vue'
import { loadShortlists, saveShortlists, toggle, type Shortlists } from './shortlist'

const DESKTOP_QUERY = '(min-width: 900px)'

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
    Footer,
    ShortlistPanel
  },
  data() {
    return {
      selectedGender: null as 'male' | 'female' | null,
      maleNames: [] as string[],
      femaleNames: [] as string[],
      maleNamesAll: [] as string[],
      femaleNamesAll: [] as string[],
      maleNamesCzech: [] as string[],
      femaleNamesCzech: [] as string[],
      isLoading: true,
      filters: {
        year: '',
        nameScope: 'czech' as 'czech' | 'all',
        sortBy: 'alpha' as 'alpha' | 'rank',
        searchText: '',
        includePluralNames: true
      },
      availableYears: [] as string[],
      namesByYear: {} as NamesByYear,
      displayedItems: [] as NameItem[],
      shortlists: loadShortlists() as Shortlists,
      isDesktop: typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
      desktopQuery: null as MediaQueryList | null,
      mobilePanelOpen: false
    }
  },
  watch: {
    shortlists: {
      deep: true,
      handler(lists: Shortlists) {
        saveShortlists(lists)
      }
    }
  },
  computed: {
    currentShortlist(): string[] {
      return this.selectedGender ? this.shortlists[this.selectedGender] : []
    },
    displayedNames(): NameItem[] {
      if (!this.selectedGender) return []
      
      let names = this.selectedGender === 'male' ? this.maleNames : this.femaleNames

      // Filter by year (for both sorting methods)
      if (this.filters.year) {
        const yearData = this.namesByYear[this.filters.year]?.[this.selectedGender] || {}
        names = names.filter(name => yearData[name])
      } else if (this.filters.nameScope === 'czech') {
        names = this.selectedGender === 'male' ? this.maleNamesCzech : this.femaleNamesCzech
      } else {
        let namesAll = this.selectedGender === 'male' ? this.maleNamesAll : this.femaleNamesAll
        var namesAllSet = new Set([...names, ...namesAll])
        names = [...namesAllSet]
      }

      // Apply text filter
      if (this.filters.searchText) {
        const searchTerm = this.filters.searchText.toUpperCase()
        names = names.filter(name => name.includes(searchTerm))
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
    setShortlist(names: string[]) {
      if (this.selectedGender) this.shortlists[this.selectedGender] = names
    },
    toggleLiked(name: string) {
      this.setShortlist(toggle(this.currentShortlist, name))
    },
    onDesktopChange(e: MediaQueryListEvent) {
      this.isDesktop = e.matches
    },
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
        const [boysNames, girlsNames, boysCzech, girlsCzech] = await Promise.all([
          this.loadCSV('/data/boys.csv'),
          this.loadCSV('/data/girls.csv'),
          this.loadCSV('/data/czech/boys.csv'),
          this.loadCSV('/data/czech/girls.csv')
        ])

        this.maleNamesAll = boysNames
        this.femaleNamesAll = girlsNames
        this.maleNamesCzech = boysCzech
        this.femaleNamesCzech = girlsCzech

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
    this.desktopQuery = window.matchMedia(DESKTOP_QUERY)
    this.desktopQuery.addEventListener('change', this.onDesktopChange)
  },
  beforeUnmount() {
    this.desktopQuery?.removeEventListener('change', this.onDesktopChange)
  }
})
</script>

<template>
  <div class="app-container">
    <div class="info-section">
      <h1>Jména v České Republice</h1>
      <p class="info-text">Neoficiální seznam jmen dětí narozených po roce 2000 a kompletní seznam jmen, které lze v ČR použít.</p>
      <p class="info-text"><em>Poznámka: Běžná česká jména jsou jména z občanského kalendáře a jména, která se v letech 2000–2025 alespoň jednou umístila v první stovce. Kompletní seznam povolených jmen byl stažen ze stránek Ministerstva vnitra. Roční seznamy jmen a jejich oblíbenost jsou vytvořeny z dat Českého statistického úřadu.</em></p>
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

      <div v-if="selectedGender" class="browse" :class="{ 'with-aside': isDesktop }">
        <NamesList
          :names="displayedNames"
          :gender="selectedGender"
          :show-rank="filters.sortBy === 'rank'"
          :liked="currentShortlist"
          :drag-enabled="isDesktop"
          @toggle="toggleLiked"
        />

        <aside v-if="isDesktop" class="shortlist-aside">
          <h3>♥ Oblíbená jména <span class="count">({{ currentShortlist.length }})</span></h3>
          <ShortlistPanel :names="currentShortlist" @update:names="setShortlist" />
        </aside>
      </div>

      <div v-if="selectedGender && !isDesktop" class="mobile-shortlist" :class="{ open: mobilePanelOpen }">
        <button
          type="button"
          class="mobile-shortlist-toggle"
          :aria-expanded="mobilePanelOpen"
          @click="mobilePanelOpen = !mobilePanelOpen"
        >
          ♥ Oblíbená ({{ currentShortlist.length }})
          <span class="chevron">{{ mobilePanelOpen ? '▼' : '▲' }}</span>
        </button>
        <div v-show="mobilePanelOpen" class="mobile-shortlist-panel">
          <ShortlistPanel :names="currentShortlist" :drop-hint="false" @update:names="setShortlist" />
        </div>
      </div>
    </template>

    <Footer />
  </div>
</template>

<style>
:root {
  color-scheme: dark;
}
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

.browse.with-aside {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}

.shortlist-aside {
  position: sticky;
  top: 20px;
  margin-top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  color: #333;
}

.shortlist-aside h3 {
  margin: 0 0 12px;
  color: #be185d;
}

.shortlist-aside .count {
  color: #6b7280;
  font-weight: normal;
}

.mobile-shortlist {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background-color: #f8f9fa;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);
  border-radius: 12px 12px 0 0;
}

.mobile-shortlist-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border: none;
  background: none;
  color: #be185d;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.mobile-shortlist-panel {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 16px 16px;
}

@media (max-width: 899px) {
  .app-container {
    padding-bottom: 80px;
  }
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}
</style>
