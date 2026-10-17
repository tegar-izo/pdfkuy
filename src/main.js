import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import MIcon from './components/MIcon.vue'
import { applyTheme } from './composables/useDarkMode'

applyTheme()

createApp(App).component('MIcon', MIcon).use(router).mount('#app')
