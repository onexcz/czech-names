<script>
export default {
  name: 'App',
  data() {
    return {
      selectedGender: null,
      maleNames: [],
      femaleNames: [],
      isLoading: true
    }
  },
  computed: {
    displayedNames() {
      return this.selectedGender === 'male' ? this.maleNames : this.femaleNames
    }
  },
  methods: {
    async loadCSV(filePath) {
      try {
        const response = await fetch(filePath)
        const text = await response.text()
        return text.split('\n')
          .filter(line => line.trim()) // Remove empty lines
          .map(line => {
            const [, name] = line.split(',')
            return name ? name.trim() : null
          })
          .filter(name => name) // Remove null/empty values
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error)
        return []
      }
    },

    async loadAllNames() {
      try {
        // Import all CSV files from the data directories
        const boysModules = import.meta.glob('/src/data/boys/*.csv')
        const girlsModules = import.meta.glob('/src/data/girls/*.csv')

        // Load boys names
        const boysPromises = Object.keys(boysModules).map(path => this.loadCSV(path))
        const boysNamesArrays = await Promise.all(boysPromises)
        this.maleNames = [...new Set(boysNamesArrays.flat())].sort()

        // Load girls names
        const girlsPromises = Object.keys(girlsModules).map(path => this.loadCSV(path))
        const girlsNamesArrays = await Promise.all(girlsPromises)
        this.femaleNames = [...new Set(girlsNamesArrays.flat())].sort()

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

      <div class="names-list" v-if="selectedGender">
        <h3>{{ selectedGender === 'male' ? 'Boys' : 'Girls' }} Names</h3>
        <ul>
          <li v-for="name in displayedNames" :key="name">{{ name }}</li>
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
</style>
