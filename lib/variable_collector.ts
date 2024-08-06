import { parse } from "acorn";
import { simple } from "acorn-walk";
import { NodeTypes } from "@vue/compiler-core";
import type { SimpleExpressionNode, ExpressionNode, TemplateChildNode, RootNode } from "@vue/compiler-core";

// const NodeTypes = {
//   ROOT: 0,
//   ELEMENT: 1,
//   TEXT: 2,
//   COMMENT: 3,
//   SIMPLE_EXPRESSION: 4,
//   INTERPOLATION: 5,
//   ATTRIBUTE: 6,
//   DIRECTIVE: 7,
//   COMPOUND_EXPRESSION: 8,
//   IF: 9,
//   IF_BRANCH: 10,
//   FOR: 11,
//   TEXT_CALL: 12,
//   VNODE_CALL: 13,
//   JS_CALL_EXPRESSION: 14,
//   JS_OBJECT_EXPRESSION: 15,
//   JS_PROPERTY: 16,
//   JS_ARRAY_EXPRESSION: 17,
//   JS_FUNCTION_EXPRESSION: 18,
//   JS_CONDITIONAL_EXPRESSION: 19,
//   JS_CACHE_EXPRESSION: 20,
//   JS_BLOCK_STATEMENT: 21,
//   JS_TEMPLATE_LITERAL: 22,
//   JS_IF_STATEMENT: 23,
//   JS_ASSIGNMENT_EXPRESSION: 24,
//   JS_SEQUENCE_EXPRESSION: 25,
//   JS_RETURN_STATEMENT: 26,
// };

function isSimpleExpressionNode(node: ExpressionNode): node is SimpleExpressionNode {
  return node.type === NodeTypes.SIMPLE_EXPRESSION;
}

export function createVariableCollector() {
  const expressions = new Set();
  const localScopeIdentifier = new Set();

  function collect(node: TemplateChildNode | RootNode | SimpleExpressionNode) {
    // 处理 ELEMENT 类型的节点，即普通 HTML 元素或 Vue 组件
    if (node.type === NodeTypes.ELEMENT) {
      // 遍历元素上定义的所有属性、指令和事件
      node.props.forEach((prop) => {
        // 如果是指令且具有表达式（例如 v-bind:style、v-on:click 等），则递归地搜集变量 剔除 v-for 指令是因为会把"(item, index) in obj"整段收集
        if (prop.type === NodeTypes.DIRECTIVE && prop.exp && prop.name !== "for") {
          collect(prop.exp);
        }

        // 处理 v-for 指令
        if (prop.type === NodeTypes.DIRECTIVE && prop.name === "for" && prop.forParseResult) {
          // 从解析结果中获取源数据、值别名和键别名
          const { source, value, key } = prop.forParseResult;
          // 收集源数据、值别名和键别名
          collect(source);
          if (value && isSimpleExpressionNode(value)) localScopeIdentifier.add(value.content);
          if (key && isSimpleExpressionNode(key)) localScopeIdentifier.add(key.content);
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
        variables.forEach(variableSet.add.bind(variableSet));
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
