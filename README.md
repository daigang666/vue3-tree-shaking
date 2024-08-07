# 针对vue3单文件组件信息，对script部分执行tree-shrking
> 示例代码：
```javascript
import { treeShakeVueSFC } from "vue3-tree-shaking";

const { code } = treeShakeVueSFC(vue_sfc);
console.log("code :", code);
```
