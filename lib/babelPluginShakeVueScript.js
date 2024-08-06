// Description: vue setup script tree shake
export default function ({ types: t }, { referencedIdentifiers }) {
  return {
    visitor: {
      // 遍历所有声明并删除未使用的
      VariableDeclaration: {
        exit(path) {
          const remainingSpecifiers = path.node?.specifiers?.filter((specifier) => {
            return !referencedIdentifiers.has(specifier.local.name);
          });
          if (remainingSpecifiers && remainingSpecifiers.length === 0) {
            path.remove();
          }
        },
      },
      VariableDeclarator: {
        enter: (path) => {
          // 删除未使用的变量声明
          if (path.node.id?.type === "Identifier") {
            const identifier = path.node.id?.name;
            const binding = path.scope.getBinding(identifier);

            if (binding && !binding.referenced && !referencedIdentifiers.has(identifier)) {
              path.remove();
            }
          }
        },
        exit: (path) => {
          // 删除未使用的变量声明
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
      // 函数调用
      CallExpression: (path) => {
        const identifier = path.node.callee.name;
        // 删除未使用的函数调用
        const binding = path.scope.getBinding(identifier);

        if (binding && !binding.referenced && !referencedIdentifiers.has(identifier)) {
          path.remove();
        }
      },
      // 函数声明
      FunctionDeclaration: (path) => {
        const identifier = path.node.id?.name;
        // 删除未使用的函数
        const binding = path.scope.getBinding(identifier);

        if (binding && !binding.referenced && !referencedIdentifiers.has(identifier)) {
          path.remove();
        }
      },
      ImportSpecifier: (path) => {
        const identifier = path.node.local?.name;
        // 删除未使用的导入模块
        const binding = path.scope.getBinding(identifier);

        if (binding && !binding.referenced && !referencedIdentifiers.has(identifier)) {
          path.remove();
        }
      },
      // 对象解构
      ObjectPattern(path) {
        // 获取当前节点的 properties 属性，即解构对象中的属性列表
        const properties = path.node.properties;
        const len = properties.length;
        const removeItem = [];
        // 遍历所有的属性
        for (let i = 0; i < len; i++) {
          const key = properties[i].key.name;
          const binding = path.scope.getBinding(key);

          // 如果这个属性的绑定为空，或者绑定未被引用，则说明它没被使用过，可以移除
          if (binding && !binding.referenced && !referencedIdentifiers.has(key)) {
            // 使用 path.get 方法获取当前属性的路径
            removeItem.push(path.get(`properties.${i}`));
          }
        }

        removeItem.forEach((item) => {
          // 调用 remove 方法将其删除
          item.remove();
        });
      },
      // 数组解构
      ArrayPattern(path) {
        const elements = path.node.elements;
        const len = elements.length;

        const removeItem = [];
        // 遍历所有的元素，检查每个元素是否被使用过
        for (let i = 0; i < len; i++) {
          if (!t.isIdentifier(elements[i])) continue;

          const name = elements[i].name;
          const binding = path.scope.getBinding(name);

          // 如果这个元素的绑定为空，或者绑定未被引用，则说明它没被使用过，可以移除
          if (binding && !binding.referenced && !referencedIdentifiers.has(name)) {
            // 使用 path.get 方法获取当前属性的路径
            removeItem.push(path.get(`elements.${i}`));
          }
        }

        removeItem.forEach((item) => {
          // 调用 remove 方法将其删除
          item.remove();
        });
      },
      ImportDeclaration: {
        exit(path) {
          // 退出 ImportDeclaration 节点时，获取当前节点的 specifiers 属性，即导入模块的属性列表
          const remainingSpecifiers = path.node.specifiers.filter((specifier) => {
            return !referencedIdentifiers.has(specifier.local.name);
          });
          // 如果 specifiers 属性为空，则说明这个导入模块没有被使用过，可以移除
          if (remainingSpecifiers.length === 0) {
            path.remove();
          }
        },
      },
    },
  };
}
