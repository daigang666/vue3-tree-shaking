import { describe, it, expect } from "vitest";
import { treeShakeVueSFC } from "../lib/index";

// 辅助函数：标准化空白以便比较
function normalizeScript(code: string): string {
  const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return "";
  return match[1].trim().replace(/\s+/g, " ");
}

function getScript(code: string): string {
  const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  return match ? match[1].trim() : "";
}

function hasImport(code: string, name: string): boolean {
  return getScript(code).includes(name);
}

// ============================================================
// Phase 0: 基础行为测试 — 验证当前正常工作的功能
// ============================================================

describe("基础: 移除未使用的命名导入", () => {
  it("移除模板中未引用的命名导入", () => {
    const sfc = `
<template><div>{{ used }}</div></template>
<script setup>
import { used, unused } from 'some-lib'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "used")).toBe(true);
    expect(hasImport(code, "unused")).toBe(false);
  });

  it("保留所有模板中引用的导入", () => {
    const sfc = `
<template><div>{{ a }} {{ b }}</div></template>
<script setup>
import { a, b, c } from 'some-lib'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "a")).toBe(true);
    expect(hasImport(code, "b")).toBe(true);
    expect(hasImport(code, "c")).toBe(false);
  });
});

describe("基础: 移除未使用的变量声明", () => {
  it("移除未使用的 const 声明", () => {
    const sfc = `
<template><div>{{ used }}</div></template>
<script setup>
import { ref } from 'vue'
const used = ref(1)
const unused = ref(2)
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("used");
    expect(getScript(code)).not.toContain("unused");
  });
});

describe("基础: 移除未使用的函数声明", () => {
  it("移除未使用的 function 声明", () => {
    const sfc = `
<template><div>{{ usedFn() }}</div></template>
<script setup>
function usedFn() { return 1 }
function unusedFn() { return 2 }
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("usedFn");
    expect(getScript(code)).not.toContain("unusedFn");
  });
});

describe("基础: 解构模式", () => {
  it("移除未使用的对象解构属性", () => {
    const sfc = `
<template><div>{{ alpha }}</div></template>
<script setup>
const { alpha, beta } = someObj
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("alpha");
    expect(getScript(code)).not.toContain("beta");
  });
});

describe("基础: 模板表达式中的变量收集", () => {
  it("收集 v-if 中的变量", () => {
    const sfc = `
<template><div v-if="show">hello</div></template>
<script setup>
import { ref } from 'vue'
const show = ref(true)
const other = ref(false)
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("show");
    expect(getScript(code)).not.toContain("other");
  });

  it("收集 v-bind 中的变量", () => {
    const sfc = `
<template><div :class="cls">hello</div></template>
<script setup>
import { ref } from 'vue'
const cls = ref('active')
const unused = ref('')
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("cls");
    expect(getScript(code)).not.toContain("unused");
  });

  it("收集插值表达式中的变量", () => {
    const sfc = `
<template><div>{{ msg + count }}</div></template>
<script setup>
import { ref } from 'vue'
const msg = ref('hello')
const count = ref(0)
const unused = ref('')
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("msg");
    expect(getScript(code)).toContain("count");
    expect(getScript(code)).not.toContain("unused");
  });

  it("收集 v-for 源数据变量，排除循环变量", () => {
    const sfc = `
<template><div v-for="item in list">{{ item }}</div></template>
<script setup>
import { ref } from 'vue'
const list = ref([])
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("list");
  });

  it("收集模板字符串中的变量", () => {
    const sfc = `
<template><div>{{ \`Hello \${name}\` }}</div></template>
<script setup>
const name = 'world'
const unused = 'x'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("name");
    expect(getScript(code)).not.toContain("unused");
  });
});

describe("基础: 无 template 或无 script setup", () => {
  it("无 script setup 时返回原始代码", () => {
    const sfc = `
<template><div>hello</div></template>
<script>
export default { name: 'Test' }
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(code).toBe(sfc);
  });
});

// ============================================================
// Phase 1: P0 修复 — 这些测试当前应该失败，修复后通过
// ============================================================

describe("P0: 副作用函数不应被删除", () => {
  it("保留 onMounted 调用", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
import { ref, onMounted } from 'vue'
const msg = ref('')
onMounted(() => { msg.value = 'hello' })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("onMounted");
  });

  it("保留 watch 调用", () => {
    const sfc = `
<template><div>{{ count }}</div></template>
<script setup>
import { ref, watch } from 'vue'
const count = ref(0)
watch(count, (val) => { console.log(val) })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("watch");
  });

  it("保留 onBeforeMount / onUnmounted 等生命周期", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
import { ref, onBeforeMount, onUnmounted } from 'vue'
const msg = ref('')
onBeforeMount(() => { msg.value = 'init' })
onUnmounted(() => { console.log('cleanup') })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("onBeforeMount");
    expect(getScript(code)).toContain("onUnmounted");
  });

  it("保留所有顶层函数调用（可能有副作用）", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
import { ref } from 'vue'
import { initSomething } from './utils'
const msg = ref('')
initSomething()
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("initSomething");
  });
});

describe("P0: 保留模板中使用的组件 import", () => {
  it("保留 PascalCase 组件导入", () => {
    const sfc = `
<template><MyButton>click</MyButton></template>
<script setup>
import MyButton from './MyButton.vue'
import UnusedComp from './UnusedComp.vue'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "MyButton")).toBe(true);
    expect(hasImport(code, "UnusedComp")).toBe(false);
  });

  it("保留 kebab-case 使用的组件导入", () => {
    const sfc = `
<template><my-button>click</my-button></template>
<script setup>
import MyButton from './MyButton.vue'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "MyButton")).toBe(true);
  });
});

describe("P0: 保留编译器宏", () => {
  it("保留 defineProps", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
import { ref } from 'vue'
const msg = ref('')
const props = defineProps({ title: String })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("defineProps");
  });

  it("保留 defineEmits", () => {
    const sfc = `
<template><div @click="emit('click')">click</div></template>
<script setup>
const emit = defineEmits(['click'])
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("defineEmits");
  });

  it("保留 defineExpose", () => {
    const sfc = `
<template><div>hello</div></template>
<script setup>
import { ref } from 'vue'
const count = ref(0)
defineExpose({ count })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("defineExpose");
  });

  it("保留 withDefaults + defineProps", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
const msg = 'hello'
const props = withDefaults(defineProps({ title: String }), { title: 'default' })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("withDefaults");
    expect(getScript(code)).toContain("defineProps");
  });
});

describe("P0: 支持默认导入和命名空间导入", () => {
  it("移除未使用的默认导入", () => {
    const sfc = `
<template><div>{{ used }}</div></template>
<script setup>
import used from './used'
import unused from './unused'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "used")).toBe(true);
    expect(hasImport(code, "unused")).toBe(false);
  });

  it("移除未使用的命名空间导入", () => {
    const sfc = `
<template><div>{{ utils.format() }}</div></template>
<script setup>
import * as utils from './utils'
import * as unused from './unused'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "utils")).toBe(true);
    expect(hasImport(code, "unused")).toBe(false);
  });
});

// ============================================================
// Phase 2: P1 能力增强
// ============================================================

describe("P1: TypeScript 支持", () => {
  it("处理 <script setup lang=\"ts\"> 中的类型导入", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
const msg = ref<string>('hello')
const unused: Ref<number> = ref(0)
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("msg");
    expect(getScript(code)).not.toContain("unused");
  });

  it("保留 lang=\"ts\" 属性", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup lang="ts">
const msg = 'hello'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(code).toContain('lang="ts"');
  });

  it("处理 TS 接口和类型别名", () => {
    const sfc = `
<template><div>{{ count }}</div></template>
<script setup lang="ts">
import { ref } from 'vue'
interface Props { title: string }
type Count = number
const count = ref<Count>(0)
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("count");
  });

  it("处理 defineProps 泛型语法", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup lang="ts">
const msg = 'hello'
const props = withDefaults(defineProps<{ title?: string }>(), { title: 'default' })
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("withDefaults");
    expect(getScript(code)).toContain("defineProps");
  });
});

describe("P1: SFC 重组装完整性", () => {
  it("保留 template 上的 lang 属性", () => {
    const sfc = `
<template lang="pug">
div {{ msg }}
</template>
<script setup>
const msg = 'hello'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(code).toContain('lang="pug"');
  });

  it("保留 style 的 scoped 和 lang 属性", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
const msg = 'hello'
</script>
<style lang="less" scoped>
.test { color: red; }
</style>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(code).toContain('lang="less"');
    expect(code).toContain("scoped");
  });

  it("保留自定义块", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
const msg = 'hello'
</script>
<i18n>
{ "en": { "hello": "Hello" } }
</i18n>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(code).toContain("<i18n>");
    expect(code).toContain("</i18n>");
  });

  it("保留多个 style 块", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
const msg = 'hello'
</script>
<style>
.global { color: red; }
</style>
<style scoped>
.local { color: blue; }
</style>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(code).toContain(".global");
    expect(code).toContain(".local");
    expect(code).toContain("scoped");
  });
});

// ============================================================
// Phase 3: P2 边界情况完善
// ============================================================

describe("P2: v-for index 变量处理", () => {
  it("v-for 的 index 不应被当作外部变量", () => {
    const sfc = `
<template>
  <div v-for="(item, index) in list">{{ item }} - {{ index }}</div>
</template>
<script setup>
import { ref } from 'vue'
const list = ref([1, 2, 3])
const index = ref(999)
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(getScript(code)).toContain("list");
    // index 是 v-for 的局部变量，script 中的 index 应被移除
    expect(getScript(code)).not.toContain("index");
  });
});

describe("P2: v-slot 作用域变量处理", () => {
  it("v-slot 解构参数不应被当作外部变量", () => {
    const sfc = `
<template>
  <MyList v-slot="{ item, index }">
    <div>{{ item }} - {{ index }}</div>
  </MyList>
</template>
<script setup>
import MyList from './MyList.vue'
const item = 'should be removed'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "MyList")).toBe(true);
    // item 是 v-slot 的局部变量，script 中的 item 应被移除
    expect(getScript(code)).not.toMatch(/const item/);
  });

  it("#default 简写 slot 参数也应被识别", () => {
    const sfc = `
<template>
  <MyList>
    <template #default="{ row }">
      <div>{{ row.name }}</div>
    </template>
  </MyList>
</template>
<script setup>
import MyList from './MyList.vue'
const row = 'should be removed'
</script>`;
    const { code } = treeShakeVueSFC(sfc);
    expect(hasImport(code, "MyList")).toBe(true);
    expect(getScript(code)).not.toMatch(/const row/);
  });
});

describe("P2: 错误处理", () => {
  it("无效的 SFC 内容不应抛出异常", () => {
    expect(() => treeShakeVueSFC("not a vue file")).not.toThrow();
  });

  it("空 template 不应抛出异常", () => {
    const sfc = `
<template></template>
<script setup>
const msg = 'hello'
</script>`;
    expect(() => treeShakeVueSFC(sfc)).not.toThrow();
  });

  it("script 中有语法错误时不应崩溃", () => {
    const sfc = `
<template><div>{{ msg }}</div></template>
<script setup>
const msg = 'hello'
const broken = {
</script>`;
    // 应该抛出有意义的错误或返回原始代码，而不是未捕获异常
    expect(() => {
      try {
        treeShakeVueSFC(sfc);
      } catch (e) {
        // Babel 解析错误是可接受的
        if (e instanceof SyntaxError || (e as Error).message?.includes("BABEL")) {
          return;
        }
        throw e;
      }
    }).not.toThrow();
  });
});
