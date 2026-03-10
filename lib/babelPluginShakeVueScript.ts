// Description: vue setup script tree shake
import type { PluginObj, types as BabelTypes } from "@babel/core";
import type { NodePath, Binding } from "@babel/traverse";
import type { Node } from "@babel/types";

// Vue 3 编译器宏，不应被删除
const COMPILER_MACROS = new Set([
  "defineProps",
  "defineEmits",
  "defineExpose",
  "defineOptions",
  "defineSlots",
  "defineModel",
  "withDefaults",
]);

function isUsed(identifier: string | undefined, binding: Binding | undefined, referencedIdentifiers: Set<string>): boolean {
  if (!identifier) return true;
  if (referencedIdentifiers.has(identifier)) return true;
  if (binding && binding.referenced) return true;
  return false;
}

// 检查是否是编译器宏调用（包括嵌套，如 withDefaults(defineProps(...), ...)）
function isCompilerMacroCall(node: Node | null | undefined): boolean {
  if (!node) return false;
  if (node.type === "CallExpression") {
    const callee = node.callee;
    if (callee.type === "Identifier" && COMPILER_MACROS.has(callee.name)) {
      return true;
    }
    if (node.arguments?.some((arg) => isCompilerMacroCall(arg as Node))) {
      return true;
    }
  }
  return false;
}

export default function ({ types: t }: { types: typeof BabelTypes }, { referencedIdentifiers }: { referencedIdentifiers: Set<string> }): PluginObj {
  return {
    visitor: {
      // 清理空的 VariableDeclaration（所有 declarator 被移除后）
      VariableDeclaration: {
        exit(path) {
          if (path.node.declarations.length === 0) {
            path.remove();
          }
        },
      },
      VariableDeclarator: {
        enter(path) {
          if (path.node.id?.type === "Identifier") {
            const identifier = path.node.id.name;
            const binding = path.scope.getBinding(identifier);

            if (!isUsed(identifier, binding, referencedIdentifiers)) {
              if (
                path.node.init?.type === "CallExpression" &&
                isCompilerMacroCall(path.node.init)
              ) {
                return;
              }
              path.remove();
            }
          }
        },
        exit(path) {
          if (path.node.id?.type === "ObjectPattern") {
            if (path.node.id.properties.length === 0) {
              path.remove();
            }
          } else if (path.node.id?.type === "ArrayPattern") {
            if (path.node.id.elements.length === 0) {
              path.remove();
            }
          }
        },
      },
      // 顶层表达式语句中的函数调用 — 保留（可能有副作用）
      // 不再主动删除 CallExpression，因为 onMounted/watch 等都是顶层调用
      FunctionDeclaration(path) {
        const identifier = path.node.id?.name;
        const binding = path.scope.getBinding(identifier!);

        if (!isUsed(identifier, binding, referencedIdentifiers)) {
          path.remove();
        }
      },
      ImportSpecifier(path) {
        const identifier = path.node.local?.name;
        const binding = path.scope.getBinding(identifier);

        if (!isUsed(identifier, binding, referencedIdentifiers)) {
          path.remove();
        }
      },
      ImportDefaultSpecifier(path) {
        const identifier = path.node.local?.name;
        const binding = path.scope.getBinding(identifier);

        if (!isUsed(identifier, binding, referencedIdentifiers)) {
          path.remove();
        }
      },
      ImportNamespaceSpecifier(path) {
        const identifier = path.node.local?.name;
        const binding = path.scope.getBinding(identifier);

        if (!isUsed(identifier, binding, referencedIdentifiers)) {
          path.remove();
        }
      },
      ObjectPattern(path) {
        const properties = path.node.properties;
        const len = properties.length;
        const removeItems: NodePath[] = [];

        for (let i = 0; i < len; i++) {
          if (t.isRestElement(properties[i])) continue;

          const prop = properties[i] as BabelTypes.ObjectProperty;
          const key = prop.value?.type === "Identifier"
            ? prop.value.name
            : (prop.key as BabelTypes.Identifier)?.name;
          if (!key) continue;

          const binding = path.scope.getBinding(key);

          if (!isUsed(key, binding, referencedIdentifiers)) {
            removeItems.push(path.get(`properties.${i}`) as NodePath);
          }
        }

        removeItems.forEach((item) => item.remove());
      },
      ArrayPattern(path) {
        const elements = path.node.elements;
        const len = elements.length;

        const removeItems: NodePath[] = [];
        for (let i = 0; i < len; i++) {
          if (!t.isIdentifier(elements[i])) continue;

          const name = (elements[i] as BabelTypes.Identifier).name;
          const binding = path.scope.getBinding(name);

          if (!isUsed(name, binding, referencedIdentifiers)) {
            removeItems.push(path.get(`elements.${i}`) as NodePath);
          }
        }

        removeItems.forEach((item) => item.remove());
      },
      ImportDeclaration: {
        exit(path) {
          if (path.node.specifiers.length === 0) {
            path.remove();
          }
        },
      },
    },
  };
}
