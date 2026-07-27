# vue-board-graph

交互式坐标棋盘图（XOY Coordinate Board Graph）Vue 3 组件。

## 在线演示

[GitHub Pages Demo](https://chinaliuxiaosong.github.io/vue-board-graph/)

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
import { XoyGraph, type XoyGraphCoords, type XoyGraphData, type XoyLoadDataParams } from 'vue-board-graph'

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
        target: { id: 'b', title: '节点 B' },
        weight: 10,
        coords: [150, 150],
      },
    ],
  }
}
</script>

<style>
@import 'vue-board-graph/style.css';
</style>
```

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
npm publish
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `loadData` | `(params: XoyLoadDataParams) => Promise<XoyGraphData>` | 必填 | 加载指定坐标范围数据的函数 |
| `centerCoords` | `XoyGraphCoords` | `[0, 0]` | 当前视图中心坐标，支持 `v-model` |
| `infoVisible` | `boolean` | `false` | 是否显示详情，影响点击空白处行为 |
| `isMobile` | `boolean` | `false` | 是否处于移动端环境 |
| `initial3D` | `boolean` | `!isMobile` | 初始是否启用 3D 模式 |

## 事件

- `show-edge`: 点击已选中的关系格时触发，参数为 `XoyEdge`
- `show-entity`: 点击已选中的实体格时触发，参数为 `(entity, coords)`
- `cancel-show`: 取消选中或切换选中时触发
- `center-change`: 视图中心坐标变化时触发

## License

MIT
