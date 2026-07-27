<template>
    <div class="xoy-graph" :class="{ 'is-3d': is3D }" @click.stop>
        <div ref="graphContainer" class="graph-container" @wheel="onWheel">
            <template v-if="data">
                <div class="graph-board">
                    <div
                        class="graph-grid"
                        :style="{
                            gridTemplateColumns: `repeat(${data.xDataRange[1] - data.xDataRange[0] + 1}, ${itemSizeValue})`,
                            gridTemplateRows: `repeat(${data.yDataRange[1] - data.yDataRange[0] + 1}, ${itemSizeValue})`,
                        }"
                    >
                        <template v-for="item of dataList" :key="`[${item.dataCoords[0]}, ${item.dataCoords[1]}]`">
                            <div
                                v-if="item.edge || item.entity"
                                class="graph-grid-item"
                                :class="{
                                    'is-selected':
                                        selectedCoords &&
                                        selectedCoords[0] === item.dataCoords[0] &&
                                        selectedCoords[1] === item.dataCoords[1],
                                }"
                                :style="{
                                    gridColumn: item.gridCoords[0],
                                    gridRow: item.gridCoords[1],
                                    '--graph-item-color-1': item.colors[0],
                                    '--graph-item-color-2': item.colors[1],
                                    '--graph-item-color-3': item.colors[2],
                                }"
                            >
                                <template v-if="item.edge">
                                    <div
                                        v-if="is3D"
                                        class="edge-content-3d"
                                        :style="{ '--graph-edge-weight': `${item.edge.weight}px` }"
                                    >
                                        <div class="cuboid">
                                            <div class="face front">
                                                <span>{{ item.edge.edge_name.split(',')[0] }}</span>
                                            </div>
                                            <div class="face back"></div>
                                            <div class="face top">
                                                <span>{{ item.edge.source.title }}</span>
                                            </div>
                                            <div class="face bottom">
                                                <span>{{ item.edge.source.title }}</span>
                                            </div>
                                            <div class="face left">
                                                <span>{{ item.edge.target.title }}</span>
                                            </div>
                                            <div class="face right">
                                                <span>{{ item.edge.target.title }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="edge-content-2d">
                                        <span>{{ item.edge.edge_name.split(',')[0] }}</span>
                                    </div>
                                </template>
                                <template v-else-if="item.entity">
                                    <div v-if="is3D" class="entity-content-3d">
                                        <div class="cylinder">
                                            <div class="face front">
                                                <span>{{ item.entity.title }}</span>
                                            </div>
                                            <div class="face center"></div>
                                            <div class="face back"></div>
                                        </div>
                                    </div>
                                    <div v-else class="entity-content-2d">
                                        <span>{{ item.entity.title }}</span>
                                    </div>
                                </template>
                            </div>
                        </template>
                    </div>
                    <div
                        v-if="selectedCoords"
                        class="graph-board-guide"
                        :style="{
                            '--guide-line-color': selectedColors[0],
                            '--guide-line-top': `${selectedCoords[1] * itemSize}px`,
                            '--guide-line-bottom': `${(selectedCoords[1] + 1) * itemSize}px`,
                            '--guide-line-left': `${selectedCoords[0] * itemSize}px`,
                            '--guide-line-right': `${(selectedCoords[0] + 1) * itemSize}px`,
                        }"
                    >
                        <div class="guide-line-center"></div>
                        <div v-if="selectedCoords[1] > 0" class="guide-line top">
                            <span>{{ selectedAxisLabel[0] }}</span>
                        </div>
                        <div v-if="selectedCoords[1] < data.yAxisMax || 0" class="guide-line bottom">
                            <span>{{ selectedAxisLabel[0] }}</span>
                        </div>
                        <div v-if="selectedCoords[0] > 0" class="guide-line left">
                            <span>{{ selectedAxisLabel[1] }}</span>
                        </div>
                        <div v-if="selectedCoords[0] < data.xAxisMax || 0" class="guide-line right">
                            <span>{{ selectedAxisLabel[1] }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        <div v-if="data" class="graph-tools">
            <button class="graph-tool-btn" :class="{ active: is3D }" @click="toggle3D">3D</button>
            <button
                class="graph-tool-btn"
                style="transform: rotateZ(90deg) rotateX(180deg)"
                @click="toggleRotate"
            >
                ⟳
            </button>
        </div>
        <div v-if="loading" class="graph-loading"><div class="graph-loading-spinner"></div></div>
    </div>
</template>

<script lang="ts">
/*
实现思路
假设棋盘大小为10000*10000，可视区域只显示最多10*10（最小缩放后20*20）
每次只处理横竖各5个(共25个，共3层)20*20小棋盘组合成的100*100大棋盘的数据
当中心点移动到内部九宫格棋盘之外时，重新加载数据渲染作为新的棋盘渲染
*/

/** 最小缩放比例 */
const MIN_SCALE = 0.5
/** 最大缩放比例 */
const MAX_SCALE = 2
/** 初始缩放比例 */
const INITIAL_SCALE = 1
/** 初始范围（在较宽的方向上显示的数量） */
const INITIAL_RANGE = 10
/** 最小缩放比例下的范围 */
const RANGE = INITIAL_RANGE / MIN_SCALE
</script>

<script setup lang="ts">
import type { BackgroundColor } from '@/styles/colors'
import { backgroundColorGroup, textStyleGroup } from '@/styles/colors'
import type { XoyAxisItem, XoyEdge, XoyEntity, XoyGraphCoords, XoyGraphData, XoyGraphRange, XoyLoadDataParams } from '@/types/xoy'
import Hammer from 'hammerjs'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

type XoyGraphPoint = [x: number, y: number]

const {
    loadData: loadDataProp,
    isMobile = false,
    initial3D: initial3DProp,
} = defineProps<{
    /** 加载指定坐标范围内数据的函数 */
    loadData: (params: XoyLoadDataParams) => Promise<XoyGraphData>
    /** 是否处于移动端环境，影响默认 3D 开关 */
    isMobile?: boolean
    /** 初始是否启用 3D 模式 */
    initial3D?: boolean
}>()

const initial3D = initial3DProp ?? !isMobile

const centerCoords = defineModel<XoyGraphCoords>('centerCoords', {
    default: () => [0, 0] as XoyGraphCoords,
})

const emit = defineEmits<{
    'show-edge': [edge: XoyEdge]
    'show-entity': [entity: XoyEntity, coords: XoyGraphCoords]
    'cancel-show': []
    'center-change': [coords: XoyGraphCoords]
}>()

const graphContainer = useTemplateRef<HTMLDivElement>('graphContainer')
const containerRect = ref({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
})

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
    updateContainerRect()
    resizeObserver = new ResizeObserver(updateContainerRect)
    if (graphContainer.value) {
        resizeObserver.observe(graphContainer.value)
    }
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
})

function updateContainerRect() {
    if (graphContainer.value) {
        const rect = graphContainer.value.getBoundingClientRect()
        containerRect.value = {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        }
    }
}

const itemSize = computed(() => Math.ceil(Math.max(containerRect.value.width, containerRect.value.height) / INITIAL_RANGE))
const itemSizeValue = computed(() => `${itemSize.value}px`)

// 数据处理

const data = ref<{
    // 坐标轴范围
    xAxisMax: number
    yAxisMax: number
    // 坐标轴
    xAxis: XoyAxisItem[]
    yAxis: XoyAxisItem[]
    // 有效数据范围，渲染网格使用
    xDataRange: XoyGraphRange
    yDataRange: XoyGraphRange
    // 内部九宫格范围，计算位置使用
    xInnerRange: XoyGraphRange
    yInnerRange: XoyGraphRange
    // 数据项
    items: XoyEdge[]
}>()

const boardWidth = computed(() => (data.value ? `${(data.value.xAxisMax + 1) * itemSize.value}px` : undefined))
const boardHeight = computed(() => (data.value ? `${(data.value.yAxisMax + 1) * itemSize.value}px` : undefined))

function dataCoordsToGridCoords(coords: XoyGraphCoords): XoyGraphCoords {
    if (data.value) {
        return [coords[0] - data.value.xDataRange[0] + 1, coords[1] - data.value.yDataRange[0] + 1]
    }
    return [coords[0] + 1, coords[1] + 1]
}

const edgeMap = computed(() => {
    const map: Record<number, Record<number, XoyEdge | undefined> | undefined> = {}
    if (data.value) {
        for (const item of data.value.items) {
            let col = map[item.coords[0]]
            if (!col) {
                col = map[item.coords[0]] = []
            }
            col[item.coords[1]] = item
        }
    }
    return map
})

const xAxisMap = computed(() => {
    const map: Record<string, XoyAxisItem | undefined> = {}
    if (data.value) {
        for (const item of data.value.xAxis) {
            map[item.v] = item
        }
    }
    return map
})

const yAxisMap = computed(() => {
    const map: Record<string, XoyAxisItem | undefined> = {}
    if (data.value) {
        for (const item of data.value.yAxis) {
            map[item.v] = item
        }
    }
    return map
})

const dataList = computed(() => {
    const items: {
        dataCoords: XoyGraphCoords
        gridCoords: XoyGraphCoords
        edge?: XoyEdge
        entity?: XoyEntity
        colors: BackgroundColor
    }[] = []
    if (data.value) {
        const { xDataRange, yDataRange } = data.value
        for (let x = xDataRange[0]; x <= xDataRange[1]; x++) {
            for (let y = yDataRange[0]; y <= yDataRange[1]; y++) {
                const xAxisItem = xAxisMap.value[x]
                const yAxisItem = yAxisMap.value[y]
                items.push({
                    dataCoords: [x, y],
                    gridCoords: dataCoordsToGridCoords([x, y]),
                    edge: edgeMap.value[x]?.[y],
                    entity:
                        xAxisItem && yAxisItem && xAxisItem.entity_id === yAxisItem.entity_id
                            ? { id: xAxisItem.entity_id, title: xAxisItem.title, description: '' }
                            : undefined,
                    colors: getCoordsColors([x, y]),
                })
            }
        }
    }
    return items
})

const gridOffset = computed(() => {
    if (data.value) {
        return {
            x: data.value.xDataRange[0] * itemSize.value,
            y: data.value.yDataRange[0] * itemSize.value,
        }
    }
    return {
        x: 0,
        y: 0,
    }
})

const loading = ref(false)

async function loadData([x, y]: XoyGraphCoords) {
    if (!loading.value) {
        loading.value = true
        const xRange: XoyGraphRange = [x - (RANGE * 5) / 2, x + (RANGE * 5) / 2]
        const yRange: XoyGraphRange = [y - (RANGE * 5) / 2, y + (RANGE * 5) / 2]
        try {
            const r = await loadDataProp({ xRange, yRange })
            const xDataRange: XoyGraphRange = [
                Math.max(0, xRange[0]),
                Math.min(r.xAxisMax, xRange[1]),
            ]
            const yDataRange: XoyGraphRange = [
                Math.max(0, yRange[0]),
                Math.min(r.yAxisMax, yRange[1]),
            ]
            data.value = {
                xAxisMax: r.xAxisMax,
                yAxisMax: r.yAxisMax,
                xAxis: r.xAxis,
                yAxis: r.yAxis,
                xDataRange,
                yDataRange,
                xInnerRange: [x - (RANGE * 3) / 2, x + (RANGE * 3) / 2],
                yInnerRange: [y - (RANGE * 3) / 2, y + (RANGE * 3) / 2],
                items: r.items,
            }
        } catch (err) {
            console.error(err)
            throw err
        } finally {
            loading.value = false
        }
    }
}

// transform变换

const transformScale = ref(INITIAL_SCALE)
const transformScaleMatrix = computed<DOMMatrixReadOnly>(
    () => new DOMMatrix(`scale3d(${transformScale.value}, ${transformScale.value}, ${transformScale.value})`)
)
const transformTempScaleMatrix = ref<DOMMatrixReadOnly>(new DOMMatrix())
const transformMatrix1 = computed(() => transformTempScaleMatrix.value.multiply(transformScaleMatrix.value))

const transformRotateMatrix = ref<DOMMatrixReadOnly>(new DOMMatrix('rotateZ(-45deg)'))
const transformTempRotateMatrix = ref<DOMMatrixReadOnly>(new DOMMatrix())
const transformMatrix2 = computed(() =>
    transformTempRotateMatrix.value.multiply(transformRotateMatrix.value.multiply(transformMatrix1.value))
)
const transformRotateDeg = computed(() => {
    const matrix = transformTempRotateMatrix.value.multiply(transformRotateMatrix.value)
    return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
})

const transformTranslateMatrix = ref<DOMMatrixReadOnly>(new DOMMatrix())
const transformTempTranslateMatrix = ref<DOMMatrixReadOnly>(new DOMMatrix())
const transformMatrix3 = computed(() =>
    transformTempTranslateMatrix.value.multiply(transformTranslateMatrix.value.multiply(transformMatrix2.value))
)

const is3D = ref(initial3D)
const transform3DDeg = 45
const transform3DRadian = (transform3DDeg * Math.PI) / 180
const transform3DInverseFactorY = Math.cos(transform3DRadian)
const transform3DMatrix = computed<DOMMatrixReadOnly>(() =>
    is3D.value ? new DOMMatrix(`rotateX(${transform3DDeg}deg)`) : new DOMMatrix()
)
function inverse3DPoint([x, y]: XoyGraphPoint): XoyGraphPoint {
    if (is3D.value) {
        return [x, y / transform3DInverseFactorY]
    }
    return [x, y]
}

const transformMatrix = computed<DOMMatrixReadOnly>(() => transform3DMatrix.value.multiply(transformMatrix3.value))
const transformMatrixValue = computed(() => transformMatrix.value.toString())

function getCurrentCenterPoint() {
    return transformMatrix3.value.inverse().transformPoint(new DOMPoint(0, 0))
}

// 当前中心坐标
const currentCenterCoords = computed<XoyGraphCoords>(() => {
    const point = getCurrentCenterPoint()
    return [Math.floor(point.x / itemSize.value), Math.floor(point.y / itemSize.value)]
})
watch(currentCenterCoords, () => {
    centerCoords.value = [...currentCenterCoords.value]
    emit('center-change', centerCoords.value)
})

// 处理变换

function toggle3D() {
    is3D.value = !is3D.value
}

function toggleRotate() {
    const centerPoint = getCurrentCenterPoint()
    const transformPoint = transformMatrix1.value.transformPoint(centerPoint)
    const newRotateMatrix = transformRotateMatrix.value
        .translate(transformPoint.x, transformPoint.y)
        .rotate(-90)
        .translate(-transformPoint.x, -transformPoint.y)
    const newMatrix = transformTranslateMatrix.value.multiply(newRotateMatrix.multiply(transformMatrix1.value))
    const newCenterPoint = newMatrix.transformPoint(centerPoint)
    const newTranslateMatrix = new DOMMatrix().translate(-newCenterPoint.x, -newCenterPoint.y)
    transformTranslateMatrix.value = newTranslateMatrix.multiply(transformTranslateMatrix.value)
    transformRotateMatrix.value = newRotateMatrix
}

let ticking = false
let rotateStartRotation = 0

function onHammerStart(event: HammerInput) {
    if (event.type === 'rotatestart') {
        rotateStartRotation = event.rotation
    }
}

function onHammer(event: HammerInput) {
    if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
            const { center, scale, rotation, deltaX, deltaY } = event
            const eventPoint = inverse3DPoint([
                center.x - (containerRect.value.right + containerRect.value.left) / 2,
                center.y - (containerRect.value.bottom + containerRect.value.top) / 2,
            ])
            transformTempScaleMatrix.value = new DOMMatrix()
            transformTempRotateMatrix.value = new DOMMatrix()
            transformTempTranslateMatrix.value = new DOMMatrix()
            const originalPoint = transformMatrix3.value
                .inverse()
                .transformPoint(new DOMPoint(eventPoint[0], eventPoint[1]))
            const point1 = transformMatrix1.value.transformPoint(originalPoint)
            const tempScale = Math.min(
                Math.max(scale, MIN_SCALE / transformScale.value),
                MAX_SCALE / transformScale.value
            )
            transformTempScaleMatrix.value = new DOMMatrix()
                .translate(point1.x, point1.y)
                .scale3d(tempScale, tempScale, tempScale)
                .translate(-point1.x, -point1.y)
            if (event.type === 'rotatemove') {
                const point2 = transformMatrix2.value.transformPoint(originalPoint)
                transformTempRotateMatrix.value = new DOMMatrix()
                    .translate(point2.x, point2.y)
                    .rotate(rotation - rotateStartRotation)
                    .translate(-point2.x, -point2.y)
            }
            const [x, y] = inverse3DPoint([deltaX, deltaY])
            transformTempTranslateMatrix.value = new DOMMatrix().translate(x, y)
            ticking = false
        })
    }
}

function onHammerEnd(event: HammerInput) {
    requestAnimationFrame(() => {
        const { center, scale, rotation, deltaX, deltaY } = event
        const oldPoint = new DOMPoint(
            ...inverse3DPoint([
                center.x - (containerRect.value.right + containerRect.value.left) / 2,
                center.y - (containerRect.value.bottom + containerRect.value.top) / 2,
            ])
        )
        const originalPoint = transformMatrix3.value.inverse().transformPoint(oldPoint)
        if (event.type === 'pinchend') {
            transformTempScaleMatrix.value = new DOMMatrix()
            transformScale.value = Math.min(Math.max(transformScale.value * scale, MIN_SCALE), MAX_SCALE)
        }
        if (event.type === 'rotateend') {
            transformTempRotateMatrix.value = new DOMMatrix()
            transformRotateMatrix.value = transformRotateMatrix.value.rotate(rotation - rotateStartRotation)
            rotateStartRotation = 0
        }
        const newPoint = transformMatrix3.value.transformPoint(originalPoint)
        transformTranslateMatrix.value = new DOMMatrix()
            .translate(oldPoint.x - newPoint.x, oldPoint.y - newPoint.y)
            .multiply(transformTranslateMatrix.value)
        if (event.type === 'panend') {
            transformTempTranslateMatrix.value = new DOMMatrix()
            transformTranslateMatrix.value = new DOMMatrix()
                .translate(...inverse3DPoint([deltaX, deltaY]))
                .multiply(transformTranslateMatrix.value)
        }
    })
}

function onWheel(event: WheelEvent) {
    const eventPoint = inverse3DPoint([
        event.x - (containerRect.value.right + containerRect.value.left) / 2,
        event.y - (containerRect.value.bottom + containerRect.value.top) / 2,
    ])
    const oldPoint = new DOMPoint(eventPoint[0], eventPoint[1])
    const originalPoint = transformMatrix3.value.inverse().transformPoint(oldPoint)
    const factor = (event.deltaY > 0 ? -1 : 1) * 0.1
    transformScale.value =
        factor > 0
            ? Math.min(transformScale.value + factor, MAX_SCALE)
            : Math.max(transformScale.value + factor, MIN_SCALE)
    const newPoint = transformMatrix3.value.transformPoint(originalPoint)
    const newTranslateMatrix = new DOMMatrix().translate(oldPoint.x - newPoint.x, oldPoint.y - newPoint.y)
    transformTranslateMatrix.value = newTranslateMatrix.multiply(transformTranslateMatrix.value)
}

// 选中

const selectedCoords = ref<XoyGraphCoords | undefined>(centerCoords.value)
const selectedColors = computed<BackgroundColor>(() =>
    selectedCoords.value ? getCoordsColors(selectedCoords.value) : ['transparent', 'transparent', 'transparent']
)
const selectedAxisLabel = computed<[string, string]>(() => {
    if (selectedCoords.value) {
        const [x, y] = selectedCoords.value
        return [xAxisMap.value[x]?.title ?? '', yAxisMap.value[y]?.title ?? '']
    }
    return ['', '']
})

function onHammerTap(event: HammerInput) {
    const eventPoint = new DOMPoint(
        ...inverse3DPoint([
            event.center.x - (containerRect.value.right + containerRect.value.left) / 2,
            event.center.y - (containerRect.value.bottom + containerRect.value.top) / 2,
        ])
    )
    const point = transformMatrix3.value.inverse().transformPoint(eventPoint)
    const [x, y] = [Math.floor(point.x / itemSize.value), Math.floor(point.y / itemSize.value)]
    const xAxisItem = xAxisMap.value[x]
    const yAxisItem = yAxisMap.value[y]
    if (selectedCoords.value && selectedCoords.value[0] === x && selectedCoords.value[1] === y) {
        const edge = edgeMap.value[x]?.[y]
        if (edge) {
            emit('show-edge', edge)
        } else if (xAxisItem && yAxisItem && xAxisItem.entity_id === yAxisItem.entity_id) {
            setTimeout(() => {
                emit('show-entity', { id: xAxisItem.entity_id, title: xAxisItem.title, description: '' }, [x, y])
            }, 50)
        }
    } else {
        selectedCoords.value = [x, y]
        emit('cancel-show')
    }
}

const hammer = ref<HammerManager>()

onMounted(() => {
    if (graphContainer.value) {
        hammer.value = new Hammer(graphContainer.value)
        hammer.value.get('pan').set({ direction: Hammer.DIRECTION_ALL })
        hammer.value
            .get('pinch')
            .set({ enable: true, threshold: 0 })
            .recognizeWith([hammer.value.get('pan')])
        hammer.value
            .get('rotate')
            .set({ enable: true, threshold: 5 })
            .recognizeWith([hammer.value.get('pinch'), hammer.value.get('pan')])
        hammer.value.on('panstart pinchstart rotatestart', onHammerStart)
        hammer.value.on('panmove pinchmove rotatemove', onHammer)
        hammer.value.on('panend pinchend rotateend', onHammerEnd)
        hammer.value.on('tap', onHammerTap)
    }
})

onBeforeUnmount(() => {
    if (hammer.value) {
        hammer.value.destroy()
        hammer.value = undefined
    }
})

// 中心点处理
watch(
    [() => centerCoords.value[0], () => centerCoords.value[1]],
    (newVal: [number, number], oldVal: [number, number]) => {
        if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1]) {
            const [x, y] = centerCoords.value
            // 如果新的中心坐标不是当前中心坐标，则移动中心坐标到中心
            if (x !== currentCenterCoords.value[0] || y !== currentCenterCoords.value[1]) {
                const point = transformMatrix2.value.transformPoint(
                    new DOMPoint(x * itemSize.value + itemSize.value / 2, y * itemSize.value + itemSize.value / 2)
                )
                transformTranslateMatrix.value = new DOMMatrix().translate(-point.x, -point.y)
            }
            // 当中心坐标不在内部九宫格棋盘时，重新加载数据
            if (data.value) {
                const {
                    xInnerRange: [xMin, xMax],
                    yInnerRange: [yMin, yMax],
                } = data.value
                if (x < xMin || xMax < x || y < yMin || yMax < y) {
                    loadData(centerCoords.value)
                }
            } else {
                loadData(centerCoords.value)
            }
        }
    }
)

onMounted(() => {
    const [x, y] = centerCoords.value
    const point = transformMatrix2.value.transformPoint(
        new DOMPoint(x * itemSize.value + itemSize.value / 2, y * itemSize.value + itemSize.value / 2)
    )
    transformTranslateMatrix.value = new DOMMatrix().translate(-point.x, -point.y)
    loadData(centerCoords.value)
})

// 样式

const textColor = textStyleGroup.dark.color
const textShadow = `${textStyleGroup.dark.shadow.offsetX}px ${textStyleGroup.dark.shadow.offsetY}px ${textStyleGroup.dark.shadow.blur}px ${textStyleGroup.dark.shadow.color}`

function getCoordsColors([x, y]: XoyGraphCoords) {
    return backgroundColorGroup[(x * 2 + y) % backgroundColorGroup.length]
}

// 2D
const itemContent2DTransform = computed(() => `rotate(${-transformRotateDeg.value}deg)`)
</script>

<style scoped lang="less">
.xoy-graph {
    position: relative;
    width: 100%;
    height: 100%;

    &.is-debug {
        padding: 10vh 10vw;

        .graph-container {
            outline: 1px solid red;

            &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                width: 100%;
                height: 1px;
                margin-top: -0.5px;
                background: #ccc;
                z-index: 10;
            }

            &::after {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                width: 1px;
                height: 100%;
                margin-left: -0.5px;
                background: #ccc;
                z-index: 10;
            }
        }
    }

    &.is-3d {
        .graph-board {
            transform-style: preserve-3d;
        }

        .graph-grid {
            transform-style: preserve-3d;
        }

        .graph-grid-item {
            transform-style: preserve-3d;
        }

        .edge-content-3d {
            transform-style: preserve-3d;

            .cuboid {
                transform-style: preserve-3d;
                backface-visibility: hidden;
            }
        }

        .entity-content-3d {
            transform-style: preserve-3d;

            .cylinder {
                transform-style: preserve-3d;
                backface-visibility: hidden;
            }
        }
    }

    .graph-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .graph-board {
        position: relative;
        top: 50%;
        left: 50%;
        display: inline-block;
        will-change: transform;
        transform: v-bind('transformMatrixValue');
        transform-origin: 0 0;
        width: v-bind('boardWidth || `auto`');
        height: v-bind('boardHeight || `auto`');
        z-index: 0;

        &::before {
            content: '';
            position: absolute;
            top: -8px;
            right: -8px;
            bottom: -8px;
            left: -8px;
            border: 4px solid rgba(200, 200, 200, 0.7);
            z-index: -2;
            pointer-events: none;
        }

        .graph-grid {
            position: relative;
            margin-top: v-bind('`${gridOffset.y}px`');
            margin-left: v-bind('`${gridOffset.x}px`');
            display: grid;
            outline: 1px solid rgba(200, 200, 200, 0.7);
            z-index: 0;

            &::before {
                content: '';
                position: absolute;
                width: calc(100% + 2px);
                height: calc(100% + 2px);
                background: linear-gradient(rgba(200, 200, 200, 0.7) 2px, transparent 1px),
                    linear-gradient(90deg, rgba(200, 200, 200, 0.7) 2px, transparent 1px);
                background-size: v-bind('itemSizeValue') v-bind('itemSizeValue');
                background-position: -1px -1px;
                z-index: -1;
            }
        }

        .graph-grid-item {
            color: v-bind('textColor');
            text-shadow: v-bind('textShadow');
            pointer-events: auto;
            font-size: calc(v-bind('itemSizeValue') * 0.15);

            .edge-content-2d {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--graph-item-color-1);
                border: 2px solid var(--graph-item-color-1);

                span {
                    transform: v-bind('itemContent2DTransform');
                }
            }

            .edge-content-3d {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;

                --cuboid-size: calc(v-bind('itemSizeValue') * 0.8);
                --cuboid-weight: calc(var(--cuboid-size) + var(--graph-edge-weight));

                .cuboid {
                    position: relative;
                    width: var(--cuboid-size);
                    height: var(--cuboid-size);

                    .face {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--graph-item-color-1);
                        box-shadow: 0 0 2px var(--graph-item-color-2);
                        writing-mode: vertical-rl;
                        text-orientation: upright;
                    }

                    .face.front {
                        transform: translateZ(var(--cuboid-weight));
                        writing-mode: unset;
                        text-orientation: unset;

                        span {
                            transform: v-bind('itemContent2DTransform');
                        }
                    }

                    .face.back {
                        transform: rotateY(180deg);
                    }

                    .face.top {
                        height: var(--cuboid-weight);
                        bottom: var(--cuboid-size);
                        transform-origin: center bottom;
                        transform: rotateZ(180deg) rotateX(-90deg);
                    }

                    .face.bottom {
                        height: var(--cuboid-weight);
                        bottom: 0;
                        transform-origin: center bottom;
                        transform: rotateX(-90deg);
                    }

                    .face.left {
                        height: var(--cuboid-weight);
                        bottom: var(--cuboid-size);
                        transform-origin: left bottom;
                        transform: rotateY(-90deg) rotateZ(90deg);
                    }

                    .face.right {
                        height: var(--cuboid-weight);
                        bottom: var(--cuboid-size);
                        transform-origin: right bottom;
                        transform: rotateY(90deg) rotateZ(-90deg);
                    }
                }
            }

            .entity-content-2d {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--graph-item-color-1);
                border: 2px solid var(--graph-item-color-1);
                border-radius: 50%;

                span {
                    transform: v-bind('itemContent2DTransform');
                }
            }

            .entity-content-3d {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;

                --cylinder-size: calc(v-bind('itemSizeValue') * 0.8);

                .cylinder {
                    position: relative;
                    width: var(--cylinder-size);
                    height: var(--cylinder-size);
                    transform: v-bind('itemContent2DTransform');

                    .face {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background: var(--graph-item-color-1);
                        box-shadow: 0 0 2px var(--graph-item-color-2);
                    }

                    .face.front {
                        transform: translateZ(var(--cylinder-size));
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                    }

                    .face.center {
                        transform: rotateX(-90deg) translateY(2px) translateY(-50%);
                    }

                    .face.back {
                        border-radius: 50%;
                    }
                }
            }

            @media (hover: hover) {
                &:hover {
                    .edge-content-2d {
                        background-color: var(--graph-item-color-2);
                        border-color: var(--graph-item-color-2);
                    }

                    .edge-content-3d {
                        .cuboid .face {
                            background: var(--graph-item-color-2);
                            box-shadow: 0 0 2px var(--graph-item-color-3);
                        }
                    }

                    .entity-content-2d {
                        background-color: var(--graph-item-color-2);
                        border-color: var(--graph-item-color-2);
                    }

                    .entity-content-3d {
                        .cylinder .face {
                            background: var(--graph-item-color-2);
                            box-shadow: 0 0 2px var(--graph-item-color-3);
                        }
                    }
                }
            }

            &.is-selected {
                .edge-content-2d {
                    border-color: var(--graph-item-color-3);
                }

                .edge-content-3d {
                    .cuboid .face {
                        box-shadow: 0 0 2px var(--graph-item-color-3);
                    }
                }

                .entity-content-2d {
                    border-color: var(--graph-item-color-3);
                }

                .entity-content-3d {
                    .cylinder .face {
                        box-shadow: 0 0 2px var(--graph-item-color-3);
                    }
                }
            }
        }

        .graph-board-guide {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            pointer-events: none;
            z-index: -1;

            .guide-line-center {
                position: absolute;
                top: var(--guide-line-top);
                left: var(--guide-line-left);
                width: v-bind('itemSizeValue');
                height: v-bind('itemSizeValue');
                background: var(--guide-line-color);
                opacity: 0.5;
            }

            .guide-line {
                position: absolute;
                background: var(--guide-line-color);
                opacity: 0.5;
                color: #fff;
                font-size: calc(v-bind('itemSizeValue') * 0.7);
                letter-spacing: calc(v-bind('itemSizeValue') * 0.3);
                overflow: hidden;

                // 以top为基准
                left: var(--guide-line-left);
                top: 0;
                width: v-bind('itemSizeValue');
                padding-bottom: calc(v-bind('itemSizeValue') * 0.85);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: end;

                & > span {
                    flex-shrink: 0;
                    writing-mode: vertical-rl;
                    text-orientation: upright;
                }

                &.top {
                    height: var(--guide-line-top);
                }

                &.bottom {
                    height: calc(v-bind('boardHeight || `100vh`') - var(--guide-line-bottom));
                    top: calc(
                        -1 * (v-bind('boardHeight || `100vh`') - var(--guide-line-bottom) - var(--guide-line-top))
                    );
                    transform-origin: center calc(100% + v-bind('itemSizeValue') / 2);
                    transform: rotate(180deg);
                }

                &.left {
                    height: var(--guide-line-left);
                    top: calc(-1 * (var(--guide-line-left) - var(--guide-line-top)));
                    transform-origin: center calc(100% + v-bind('itemSizeValue') / 2);
                    transform: rotate(-90deg);
                }

                &.right {
                    height: calc(v-bind('boardWidth || `100vw`') - var(--guide-line-right));
                    top: calc(-1 * (v-bind('boardWidth || `100vw`') - var(--guide-line-right) - var(--guide-line-top)));
                    transform-origin: center calc(100% + v-bind('itemSizeValue') / 2);
                    transform: rotate(90deg);
                }
            }
        }
    }

    .graph-tools {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .graph-tool-btn {
        width: 30px;
        height: 30px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        background: #fff;
        color: #606266;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            color: #409eff;
            border-color: #c6e2ff;
            background: #ecf5ff;
        }

        &.active {
            color: #fff;
            background: #409eff;
            border-color: #409eff;
        }
    }

    .graph-loading {
        position: absolute;
        top: 16px;
        right: 56px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;

        .graph-loading-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(64, 158, 255, 0.2);
            border-top-color: #409eff;
            border-radius: 50%;
            animation: xoy-spin 1s linear infinite;
        }
    }
}

@keyframes xoy-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
