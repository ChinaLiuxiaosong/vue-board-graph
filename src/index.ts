import type { App } from 'vue'
import XoyGraph from './components/XoyGraph.vue'

export { XoyGraph }

export type {
    XoyAxisItem,
    XoyEdge,
    XoyEntity,
    XoyGraphCoords,
    XoyGraphData,
    XoyGraphRange,
    XoyLoadDataParams,
} from './types/xoy'

export type { BackgroundColor } from './styles/colors'

export default {
    install(app: App) {
        app.component('XoyGraph', XoyGraph)
    },
}
