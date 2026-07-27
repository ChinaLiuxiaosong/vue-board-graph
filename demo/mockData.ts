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
const ENTITY_COUNT = 200
const EDGE_COUNT = 500
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
    v: number
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

    // 生成实体，每个实体占据对角线上的一个坐标 (v, v)
    const usedValues = new Set<number>()
    entities = []
    while (entities.length < ENTITY_COUNT) {
        const v = Math.floor(random() * (AXIS_MAX - 20)) + 10
        if (usedValues.has(v)) continue
        usedValues.add(v)
        entities.push({
            id: `entity-${entities.length}`,
            title: conceptPool[entities.length % conceptPool.length] + (Math.floor(entities.length / conceptPool.length) || ''),
            v,
        })
    }

    entities.sort((a, b) => a.v - b.v)

    // 生成边：每个实体连接 2-5 个其他实体，边坐标为 (source.v, target.v)
    edges = []
    for (let i = 0; i < ENTITY_COUNT; i++) {
        const source = entities[i]
        const degree = 2 + Math.floor(random() * 4)
        const others = entities
            .filter((target) => target.id !== source.id)
            .map((target) => ({
                target,
                distance: Math.abs(target.v - source.v),
            }))
            .filter((item) => item.distance > 0)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, degree)

        for (const { target, distance } of others) {
            const weight = Math.max(2, Math.min(20, Math.round(distance / 10)))
            edges.push({
                id: `edge-${source.id}-${target.id}`,
                edge_name: `${source.title},${target.title}`,
                source,
                target,
                weight,
                coords: [source.v, target.v],
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
                .filter((e) => inRange(e.v, xRange))
                .map((e) => ({
                    v: e.v,
                    title: e.title,
                    entity_id: e.id,
                }))
                .sort((a, b) => a.v - b.v)

            const yAxis = entities
                .filter((e) => inRange(e.v, yRange))
                .map((e) => ({
                    v: e.v,
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
