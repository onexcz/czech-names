<template>
  <div class="gender-selection">
    <div 
      class="gender-card male"
      :class="{ active: modelValue === 'male' }"
      @click="$emit('update:modelValue', 'male')"
    >
      <h2>CHLAPCI</h2>
    </div>
    <div 
      class="gender-card female"
      :class="{ active: modelValue === 'female' }"
      @click="$emit('update:modelValue', 'female')"
    >
      <h2>DÍVKY</h2>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GenderSelector',
  props: {
    modelValue: {
      type: String as () => 'male' | 'female' | null,
      required: true
    }
  },
  emits: ['update:modelValue']
})
</script>

<style scoped>
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
</style> 