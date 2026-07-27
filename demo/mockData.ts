import type { XoyGraphData, XoyLoadDataParams, XoyGraphRange } from 'vue-board-graph'

const conceptPool = [
    '人工智能',
    '机器学习',
    '深度学习',
    '神经网络',
    '计算机视觉',
    '自然语言处理',
    '知识图谱',
    '推荐系统',
    '强化学习',
    '生成模型',
    '图神经网络',
    '迁移学习',
    '多模态学习',
    '预训练模型',
    '向量检索',
    '可解释 AI',
    '联邦学习',
    'AutoML',
    '因果推断',
    '时间序列',
    '异常检测',
    '数据挖掘',
    '特征工程',
    '模型蒸馏',
    '超分辨率',
]

const AXIS_MAX = 1000
const ENTITY_COUNT = 120
const EDGE_COUNT = 300
const DEFAULT_SEED = 42

/**
 * 简单的线性同余随机数生成器，支持可复现的 seed。
 */
function createRng(seed: number) {
    let state = seed
    return function random() {
        state = (state * 9301 + 49297) % 233280
        return state / 233280
    }
}

interface MockEntity {
    id: string
    title: string
    x: number
    y: number
}

interface MockEdge {
    id: string
    edge_name: string
    source: MockEntity
    target: MockEntity
    weight: number
    coords: [number, number]
}

let seed = DEFAULT_SEED
let entities: MockEntity[] = []
let edges: MockEdge[] = []

function buildMockData(currentSeed: number) {
    const random = createRng(currentSeed)

    // 生成实体，均匀分布在坐标轴上
    entities = Array.from({ length: ENTITY_COUNT }, (_, i) => {
        const x = Math.floor(random() * (AXIS_MAX - 20)) + 10
        const y = Math.floor(random() * (AXIS_MAX - 20)) + 10
        return {
            id: `entity-${i}`,
            title: conceptPool[i % conceptPool.length] + (Math.floor(i / conceptPool.length) || ''),
            x,
            y,
        }
    })

    // 按坐标排序，确保轴标签有序
    entities.sort((a, b) => a.x - b.x || a.y - b.y)

    // 生成边：每个实体连接 2-5 个最近邻
    edges = []
    for (let i = 0; i < ENTITY_COUNT; i++) {
        const source = entities[i]
        const degree = 2 + Math.floor(random() * 4)
        const others = entities
            .map((target) => ({
                target,
                distance: Math.hypot(target.x - source.x, target.y - source.y),
            }))
            .filter((item) => item.distance > 0)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, degree)

        for (const { target, distance } of others) {
            const weight = Math.max(2, Math.min(20, Math.round(distance / 10)))
            const midX = Math.round((source.x + target.x) / 2)
            const midY = Math.round((source.y + target.y) / 2)
            edges.push({
                id: `edge-${source.id}-${target.id}`,
                edge_name: `${source.title},${target.title}`,
                source,
                target,
                weight,
                coords: [midX, midY],
            })
        }
    }

    // 如果边数量超过预期，随机截取
    if (edges.length > EDGE_COUNT) {
        edges = edges.sort(() => random() - 0.5).slice(0, EDGE_COUNT)
    }
}

buildMockData(seed)

/**
 * 设置演示数据的随机种子。相同的种子会生成完全一致的图结构。
 */
export function setGraphSeed(newSeed: number) {
    seed = newSeed
    buildMockData(seed)
}

/**
 * 获取当前演示数据的随机种子。
 */
export function getGraphSeed() {
    return seed
}

function inRange(value: number, [min, max]: XoyGraphRange) {
    return value >= min && value <= max
}

export function loadData({ xRange, yRange }: XoyLoadDataParams): Promise<XoyGraphData> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const xAxis = entities
                .filter((e) => inRange(e.x, xRange))
                .map((e) => ({
                    v: e.x,
                    title: e.title,
                    entity_id: e.id,
                }))
                .sort((a, b) => a.v - b.v)

            const yAxis = entities
                .filter((e) => inRange(e.y, yRange))
                .map((e) => ({
                    v: e.y,
                    title: e.title,
                    entity_id: e.id,
                }))
                .sort((a, b) => a.v - b.v)

            const items = edges
                .filter((edge) => inRange(edge.coords[0], xRange) && inRange(edge.coords[1], yRange))
                .map((edge) => ({
                    id: edge.id,
                    edge_name: edge.edge_name,
                    description: '',
                    source: {
                        id: edge.source.id,
                        title: edge.source.title,
                        description: '',
                    },
                    target: {
                        id: edge.target.id,
                        title: edge.target.title,
                        description: '',
                    },
                    weight: edge.weight,
                    coords: edge.coords,
                }))

            resolve({
                xAxisMax: AXIS_MAX,
                yAxisMax: AXIS_MAX,
                xAxis,
                yAxis,
                items,
            })
        }, 300 + Math.random() * 400)
    })
}
