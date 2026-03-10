# vue3-tree-shaking

[![npm version](https://img.shields.io/npm/v/vue3-tree-shaking.svg)](https://www.npmjs.com/package/vue3-tree-shaking)
[![license](https://img.shields.io/npm/l/vue3-tree-shaking.svg)](https://github.com/daigang666/vue3-tree-shaking/blob/master/LICENSE)

针对 Vue 3 单文件组件（SFC）的 `<script setup>` 部分执行 tree-shaking，自动移除模板中未使用的 import、变量、函数声明。

适用于低代码平台、代码生成器等场景，清理自动生成代码中的冗余部分。

## 安装

```bash
npm install vue3-tree-shaking
```

## 使用

```javascript
import { treeShakeVueSFC } from "vue3-tree-shaking";

const sfcCode = `
<template>
  <div>{{ msg }}</div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { unusedUtil } from './utils'

const msg = ref('hello')
const unused = ref('removed')
</script>`;

const { code } = treeShakeVueSFC(sfcCode);
// computed、unusedUtil、unused 将被移除
```

## 功能

- 移除未使用的 `import` 语句（命名导入、默认导入、命名空间导入）
- 移除未使用的变量声明、函数声明
- 移除未使用的对象/数组解构属性
- 保留副作用调用（`onMounted`、`watch`、`watchEffect` 等）
- 保留编译器宏（`defineProps`、`defineEmits`、`defineExpose`、`withDefaults` 等）
- 保留模板中使用的组件对应的 import（支持 PascalCase 和 kebab-case）
- 识别 `v-for`、`v-slot` 的局部作用域变量
- 支持 `<script setup lang="ts">`
- 完整保留 `<template>`、`<style>`、自定义块及其属性

## API

### `treeShakeVueSFC(sfcContent: string)`

| 参数 | 类型 | 说明 |
|------|------|------|
| `sfcContent` | `string` | Vue SFC 文件内容 |

返回值：

```typescript
{
  code: string;           // tree-shaking 后的 SFC 代码
  usedVariables: Set<string>;  // 模板中引用的变量集合
  descriptor: SFCDescriptor;   // 解析后的 SFC 描述符
  babelResult: object;         // Babel 转换结果
}
```

## 示例

输入：

```vue
<template>
  <MyButton @click="handleClick">{{ msg }}</MyButton>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatDate, formatNumber } from './utils'
import MyButton from './MyButton.vue'

const msg = ref('hello')
const count = ref(0)
const double = computed(() => count.value * 2)

onMounted(() => {
  console.log('mounted')
})

function handleClick() {
  msg.value = 'clicked'
}

function unusedFn() {
  return 'never used'
}
</script>
```

输出：

```vue
<template>
  <MyButton @click="handleClick">{{ msg }}</MyButton>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MyButton from './MyButton.vue'

const msg = ref('hello')

onMounted(() => {
  console.log('mounted')
})

function handleClick() {
  msg.value = 'clicked'
}
</script>
```

移除了：`computed`、`formatDate`、`formatNumber`、`count`、`double`、`unusedFn`。

## 环境支持

- Node.js
- 浏览器（通过 `@babel/standalone`）

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（demo 页面）
npm run dev

# 运行测试
npm test

# 构建
npm run build
```

## License

[MIT](./LICENSE)
