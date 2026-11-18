<template>
  <ShareView v-if="shared" :lists="shared" />
  <App v-else />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import App from './App.vue'
import ShareView from './components/ShareView.vue'
import { parseShareHash } from './share'

/** Shows the read-only shared list for `#sdilet…` links, the name browser otherwise. */
export default defineComponent({
  name: 'Root',
  components: { App, ShareView },
  data() {
    return { hash: window.location.hash }
  },
  computed: {
    shared() {
      return parseShareHash(this.hash)
    }
  },
  mounted() {
    window.addEventListener('hashchange', this.onHashChange)
  },
  beforeUnmount() {
    window.removeEventListener('hashchange', this.onHashChange)
  },
  methods: {
    onHashChange() {
      this.hash = window.location.hash
    }
  }
})
</script>
