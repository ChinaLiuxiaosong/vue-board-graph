export type XoyGraphCoords = [x: number, y: number]

export type XoyGraphRange = [begin: number, end: number]

export interface XoyEntity {
    id: string | number
    title: string
    description?: string
}

export interface XoyAxisItem {
    v: number
    title: string
    entity_id: string | number
}

export interface XoyEdge {
    id: string | number
    edge_name: string
    description?: string
    source: XoyEntity
    target: XoyEntity
    weight: number
    coords: XoyGraphCoords
}

export interface XoyGraphData {
    // 坐标轴范围
    xAxisMax: number
    yAxisMax: number
    // 坐标轴
    xAxis: XoyAxisItem[]
    yAxis: XoyAxisItem[]
    // 数据项
    items: XoyEdge[]
}

export interface XoyLoadDataParams {
    xRange: XoyGraphRange
    yRange: XoyGraphRange
}
