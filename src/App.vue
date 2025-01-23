<script>
export default {
  name: 'App',
  data() {
    return {
      selectedGender: null,
      maleNames: [],
      femaleNames: [],
      isLoading: true,
      filters: {
        year: '',
        sortBy: 'alpha', // 'alpha' or 'rank'
        searchText: ''
      },
      availableYears: [],
      namesByYear: {} // Will store name-rank mappings for each year
    }
  },
  computed: {
    displayedNames() {
      if (!this.selectedGender) return []
      
      let names = this.selectedGender === 'male' ? this.maleNames : this.femaleNames
      
      // Apply text filter
      if (this.filters.searchText) {
        const searchTerm = this.filters.searchText.toUpperCase()
        names = names.filter(name => name.includes(searchTerm))
      }

      // If year is selected and sorting by rank
      if (this.filters.year && this.filters.sortBy === 'rank') {
        const yearData = this.namesByYear[this.filters.year]?.[this.selectedGender] || {}
        // Filter names that exist in selected year and add rank information
        names = names
          .filter(name => yearData[name])
          .map(name => ({
            name,
            rank: yearData[name]
          }))
          .sort((a, b) => {
            // Parse ranks (handle ranges like "14-15" by taking first number)
            const rankA = parseInt(a.rank.split('-')[0])
            const rankB = parseInt(b.rank.split('-')[0])
            return rankA - rankB
          })
      } else {
        // Alphabetical sorting
        names = names.sort()
        // Convert to object format to match rank format
        names = names.map(name => ({ name, rank: '' }))
      }
      
      return names
    }
  },
  methods: {
    async loadCSV(filePath) {
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
                const gender = filePath.includes('/boys/') ? 'male' : 'female'
                this.namesByYear[year][gender][upperName] = rank
              }
              return upperName
            }
            return null
          })
          .filter(name => name)

        return names
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error)
        return []
      }
    },

    async loadAllNames() {
      try {
        const boysModules = import.meta.glob('/src/data/boys/*.csv')
        const girlsModules = import.meta.glob('/src/data/girls/*.csv')

        // Extract available years from file paths
        this.availableYears = [...new Set([
          ...Object.keys(boysModules).map(path => path.match(/\/(\d{4})\.csv$/)?.[1]),
          ...Object.keys(girlsModules).map(path => path.match(/\/(\d{4})\.csv$/)?.[1])
        ].filter(year => year))]
        .sort((a, b) => b - a) // Sort years descending

        // Load boys names
        const boysPromises = Object.keys(boysModules).map(path => this.loadCSV(path))
        const boysNamesArrays = await Promise.all(boysPromises)
        const boysSet = new Set(boysNamesArrays.flat())
        this.maleNames = [...boysSet]

        // Load girls names
        const girlsPromises = Object.keys(girlsModules).map(path => this.loadCSV(path))
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
}
</script>

<template>
  <div class="app-container">
    <div class="info-section">
      <h1>Czech Names Database</h1>
      <p class="info-text">Explore popular Czech names given to newborns since the year 2000.</p>
      <p class="info-text"><em>Note: This is not a complete list of all Czech names, but rather a collection of names commonly used for newborns in recent decades.</em></p>
    </div>

    <div v-if="isLoading" class="loading">
      Loading names...
    </div>

    <template v-else>
      <div class="gender-selection">
        <div 
          class="gender-card male"
          :class="{ active: selectedGender === 'male' }"
          @click="selectedGender = 'male'"
        >
          <i class="fas fa-mars"></i>
          <h2>BOYS</h2>
        </div>
        <div 
          class="gender-card female"
          :class="{ active: selectedGender === 'female' }"
          @click="selectedGender = 'female'"
        >
          <i class="fas fa-venus"></i>
          <h2>GIRLS</h2>
        </div>
      </div>

      <div v-if="selectedGender" class="filters">
        <div class="filter-group">
          <label for="year">Year:</label>
          <select id="year" v-model="filters.year">
            <option value="">All years</option>
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="sort">Sort by:</label>
          <select 
            id="sort" 
            v-model="filters.sortBy"
            :title="!filters.year && filters.sortBy === 'rank' ? 'Select a year to sort by rank' : ''"
          >
            <option value="alpha">Alphabetically</option>
            <option value="rank" :disabled="!filters.year">By rank</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search">Search:</label>
          <input 
            id="search" 
            type="text" 
            v-model="filters.searchText" 
            placeholder="Filter names..."
          >
        </div>
      </div>

      <div class="names-list" v-if="selectedGender">
        <h3>{{ selectedGender === 'male' ? 'Boys' : 'Girls' }} Names</h3>
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
  padding: 20px;
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
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.9rem;
  color: #666;
}

.filter-group select,
.filter-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.names-list li {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.rank {
  color: #666;
  font-size: 0.9em;
  min-width: 30px;
  text-align: right;
}

select[disabled] {
  cursor: not-allowed;
  opacity: 0.7;
}

select[title] {
  cursor: help;
}
</style>
