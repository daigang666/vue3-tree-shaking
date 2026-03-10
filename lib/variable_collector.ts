import { parse } from "acorn";
import { simple } from "acorn-walk";
import { ElementTypes, NodeTypes } from "@vue/compiler-core";
import type { SimpleExpressionNode, ExpressionNode, TemplateChildNode, RootNode } from "@vue/compiler-core";

function isSimpleExpressionNode(node: ExpressionNode): node is SimpleExpressionNode {
  return node.type === NodeTypes.SIMPLE_EXPRESSION;
}

// 将 kebab-case 转为 PascalCase（如 my-component → MyComponent）
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function createVariableCollector() {
  const expressions = new Set();
  const localScopeIdentifier = new Set();
  const componentTags = new Set<string>();

  function collect(node: TemplateChildNode | RootNode | SimpleExpressionNode) {
    // 处理 ELEMENT 类型的节点，即普通 HTML 元素或 Vue 组件
    if (node.type === NodeTypes.ELEMENT) {
      // 收集组件标签名（非原生 HTML/SVG 标签视为组件）
      if (node.tagType === ElementTypes.COMPONENT) {
        componentTags.add(node.tag);
      }

      // 遍历元素上定义的所有属性、指令和事件
      node.props.forEach((prop) => {
        // 如果是指令且具有表达式（例如 v-bind:style、v-on:click 等），则递归地搜集变量 剔除 v-for 指令是因为会把"(item, index) in obj"整段收集
        if (prop.type === NodeTypes.DIRECTIVE && prop.exp && prop.name !== "for") {
          // 处理 v-slot 作用域变量
          if (prop.name === "slot" && prop.exp) {
            const slotParams = prop.exp as SimpleExpressionNode;
            if (slotParams.content) {
              extractIdentifiers(slotParams.content).forEach((v) => localScopeIdentifier.add(v));
            }
            return;
          }
          collect(prop.exp);
        }

        // 处理 v-for 指令
        if (prop.type === NodeTypes.DIRECTIVE && prop.name === "for" && prop.forParseResult) {
          const { source, value, key, index } = prop.forParseResult;
          collect(source);
          if (value && isSimpleExpressionNode(value)) localScopeIdentifier.add(value.content);
          if (key && isSimpleExpressionNode(key)) localScopeIdentifier.add(key.content);
          if (index && isSimpleExpressionNode(index)) localScopeIdentifier.add(index.content);
        }
      });
    }
    // 处理 INTERPOLATION 类型的节点，即插值表达式如 {{ message }}
    else if (node.type === NodeTypes.INTERPOLATION) {
      collect(node.content);
    }
    // 处理 COMPOUND_EXPRESSION 类型的节点，即复合表达式
    else if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
      node.children.forEach((child) => {
        if (typeof child !== "string" && typeof child !== "symbol") {
          collect(child);
        }
      });
    }
    // 处理 SIMPLE_EXPRESSION 类型的节点，即简单表达式
    else if (node.type === NodeTypes.SIMPLE_EXPRESSION) {
      // 如果表达式不是静态的，则收集变量
      if (!node.isStatic) {
        expressions.add(node.content);
      }
    }
  }
  return {
    collect,
    getVariables: () => {
      const variableSet = new Set<string>();
      expressions.forEach((item) => {
        // 如果变量是局部变量，则跳过
        if (localScopeIdentifier.has(item)) {
          return;
        }
        // 拼接表达式再解析，是为了处理如：person.age 获取得到person
        const { variables } = parseExpression(`const __mei_yong_de_ = ${item}`);
        variables.forEach((v) => {
          // 解析后的变量也需要检查是否是局部变量
          if (!localScopeIdentifier.has(v)) {
            variableSet.add(v);
          }
        });
      });
      // 将组件标签名映射为 PascalCase 并加入变量集合
      componentTags.forEach((tag) => {
        // PascalCase 标签直接加入
        variableSet.add(tag);
        // kebab-case 标签转为 PascalCase
        if (tag.includes("-")) {
          variableSet.add(toPascalCase(tag));
        }
      });
      return variableSet;
    },
  };
}

// 解析 JavaScript 表达式以查找变量、函数及导入的模块
function parseExpression(expression: string) {
  const variables = new Set<string>();
  const functions = new Set<string>();

  try {
    const ast = parse(expression, { ecmaVersion: 2022 });
    simple(ast, {
      Identifier(node) {
        variables.add(node.name);
      },
      FunctionDeclaration(node) {
        const id = node.id ? node.id.name : "";
        if (id) functions.add(id);
      },
    });
  } catch (e) {
    console.log(e);
  }

  return {
    variables: Array.from<string>(variables),
    functions: Array.from(functions),
  };
}

// 从解构模式字符串中提取所有标识符（如 "{ item, index }" → ["item", "index"]）
function extractIdentifiers(pattern: string): string[] {
  // 匹配 JS 标识符，排除解构语法字符
  const matches = pattern.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
  return matches || [];
}
