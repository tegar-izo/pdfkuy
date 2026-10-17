import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { applyTheme } from './composables/useDarkMode'

applyTheme()

createApp(App).use(router).mount('#app')
