<template>
    <div class="demo-app">
        <div class="demo-header">
            <h1>Vue Board Graph</h1>
            <p>交互式坐标棋盘图组件演示。点击网格选中，再次点击触发节点或关系。支持拖拽、缩放、旋转、2D/3D 切换。点击空白处取消选中。</p>
        </div>
        <div class="demo-graph">
            <XoyGraph
                v-model:center-coords="centerCoords"
                :load-data="loadData"
                @show-edge="onShowEdge"
                @show-entity="onShowEntity"
                @cancel-show="onCancelShow"
                @center-change="onCenterChange"
            />
        </div>
        <div v-if="info" class="demo-info">
            <template v-if="info.type === 'edge'">
                <strong>关系：</strong> {{ info.edge.edge_name }}
                <span>{{ info.edge.source.title }} → {{ info.edge.target.title }}</span>
            </template>
            <template v-else-if="info.type === 'entity'">
                <strong>实体：</strong> {{ info.entity.title }}
                <span>坐标：{{ info.coords.join(', ') }}</span>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XoyGraph, type XoyEdge, type XoyEntity, type XoyGraphCoords } from 'vue-board-graph'
import { loadData } from './mockData'

const centerCoords = ref<XoyGraphCoords>([500, 500])

const info = ref<
    | { type: 'edge'; edge: XoyEdge }
    | { type: 'entity'; entity: XoyEntity; coords: XoyGraphCoords }
    | undefined
>()

function onShowEdge(edge: XoyEdge) {
    info.value = { type: 'edge', edge }
}

function onShowEntity(entity: XoyEntity, coords: XoyGraphCoords) {
    info.value = { type: 'entity', entity, coords }
}

function onCancelShow() {
    info.value = undefined
}

function onCenterChange(coords: XoyGraphCoords) {
    console.log('center-change', coords)
}
</script>

<style lang="less">
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>

<style scoped lang="less">
.demo-app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f0f4f8;
}

.demo-header {
    padding: 16px 24px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    z-index: 1;

    h1 {
        margin: 0 0 8px;
        font-size: 20px;
        color: #1a202c;
    }

    p {
        margin: 0;
        font-size: 14px;
        color: #4a5568;
    }
}

.demo-graph {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.demo-info {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    color: #2d3748;
    pointer-events: none;
    white-space: nowrap;

    span {
        color: #718096;
        margin-left: 8px;
    }
}
</style>
