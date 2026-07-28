# vue-board-graph

[![npm](https://img.shields.io/npm/v/vue-board-graph.svg)](https://www.npmjs.com/package/vue-board-graph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 交互式坐标棋盘图（Coordinate Board Graph）Vue 3 组件，支持 **2D / 2.5D（3D 倾斜）视角切换、旋转、缩放、平移**。基于 CSS 3D transform，可用于知识图谱实体关系、棋盘类游戏、仓储/厂房地图等场景。

## 在线演示

[GitHub Pages Demo](https://chinaliuxiaosong.github.io/vue-board-graph/)

## 用途

- 知识图谱里实体节点的物理空间布局
- 围棋 / 象棋 / 自定义棋类的棋盘
- 仓储 / 厂房地图（鸟瞰 + 透视双视角）
- 任何需要"网格 + 双视角"的可视化

## 安装

```bash
bun add vue-board-graph
```

## 使用

```vue
<template>
  <XoyGraph v-model:center-coords="centerCoords" :load-data="loadData" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XoyGraph, type XoyGraphCoords, type XoyGraphData, type XoyGraphRange, type XoyLoadDataParams } from 'vue-board-graph'

const centerCoords = ref<XoyGraphCoords>([500, 500])

async function loadData({ xRange, yRange }: XoyLoadDataParams): Promise<XoyGraphData> {
  return {
    xAxisMax: 1000,
    yAxisMax: 1000,
    xAxis: [
      { v: 100, title: '节点 A', entity_id: 'a' },
      { v: 200, title: '节点 B', entity_id: 'b' },
    ],
    yAxis: [
      { v: 100, title: '节点 A', entity_id: 'a' },
      { v: 200, title: '节点 C', entity_id: 'c' },
    ],
    items: [
      {
        id: '1',
        edge_name: '相关',
        source: { id: 'a', title: '节点 A' },
        target: { id: 'c', title: '节点 C' },
        weight: 10,
        coords: [100, 200],
      },
    ],
  }
}
</script>

<style>
@import 'vue-board-graph/style.css';
</style>
```

也支持全局注册：

```ts
import { createApp } from 'vue'
import VueBoardGraph from 'vue-board-graph'
import 'vue-board-graph/style.css'

const app = createApp(App)
app.use(VueBoardGraph)
```

## 坐标棋盘图数据模型

棋盘图的 X 轴和 Y 轴代表同一组实体：

- 每个实体占据对角线坐标 `(v, v)`。
- 坐标 `(v, v)` 显示实体本身，使用圆形棋子。
- 坐标 `(v1, v2)` 显示实体 `v1` 与实体 `v2` 之间的关系，使用矩形/长条棋子。
- 演示数据应先生成实体，再生成实体之间的关系，避免用父子树结构模拟。

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `loadData` | `(params: XoyLoadDataParams) => Promise<XoyGraphData>` | 必填 | 加载指定坐标范围数据的函数 |
| `centerCoords` | `XoyGraphCoords` | `[0, 0]` | 当前视图中心坐标，支持 `v-model` |
| `isMobile` | `boolean` | `false` | 是否处于移动端环境 |
| `initial3D` | `boolean` | `!isMobile` | 初始是否启用 3D 模式 |

## 事件

- `show-edge(edge: XoyEdge)`: 点击已选中的关系格时触发
- `show-entity(entity, coords)`: 点击已选中的实体格时触发
- `cancel-show`: 切换选中格子时触发（用于关闭外部详情面板）
- `center-change(coords: XoyGraphCoords)`: 视图中心坐标变化时触发

## 实现要点

- **CSS 3D transform 驱动**：单元格内可放任意 Vue 内容，3D 视角下用立方体/圆柱体包一层就能"长高"
- **统一矩阵变换栈**：平移 / 旋转 / 缩放 / 3D 倾斜 4 个独立维度，可叠加可重置
- **以锚点为中心缩放**：滚轮缩放视觉上"放大鼠标位置"，不是中心放大

## 开发

```bash
# 安装依赖
bun install

# 启动演示
bun run dev

# 构建库（纯 Bun，输出 JS/CSS）
bun run build:lib

# 生成 TypeScript 类型声明（需 Node.js 兼容环境）
bun run build:types

# 构建演示
bun run build:demo

# 类型检查
bun run typecheck
```

## 发布

发布到 npm 前，请执行 `prepublishOnly` 脚本，确保同时构建库产物和类型声明：

```bash
bun run prepublishOnly
npm publish --registry https://registry.npmjs.org/
```

## 配套

与 [vue-honeycomb](https://github.com/ChinaLiuxiaosong/vue-honeycomb) 共享同款交互模式，可以混合使用：蜂窝图做"概念近邻"视图，棋盘图做"实体关系"视图。

## License

[MIT](./LICENSE) © 2026 Liu Xiaosong
