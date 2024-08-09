import { parse } from "@vue/compiler-sfc";
import { transform } from "@vue/compiler-core";
import type { RootNode } from "@vue/compiler-core";
import { transform as BabelTransform } from "@babel/standalone";
import { createVariableCollector } from "./variable_collector.js";
import babelPluginShakeVueScript from "./babelPluginShakeVueScript.js";

// 获取模板中使用的变量
function getTemplateUsedVars(templateAst?: RootNode) {
  const variableCollector = createVariableCollector();
  if (!templateAst) {
    return variableCollector.getVariables();
  }
  transform(templateAst, {
    nodeTransforms: [
      (node) => {
        variableCollector.collect(node);
      },
    ],
  });

  return variableCollector.getVariables();
}
// 移除script中未使用的变量
function removeUnusedVars(scriptCode: string, usedVariables: Set<string>) {
  const result = BabelTransform(scriptCode, {
    plugins: [[babelPluginShakeVueScript, { referencedIdentifiers: usedVariables }]],
  });
  return result;
}

/**
 * 根据模板中的变量使用情况 对script部分执行Tree Shaking
 * @param sfcContent vue文件内容
 * @returns
 */
export function treeShakeVueSFC(sfcContent: string) {
  const { descriptor } = parse(sfcContent);
  const { template, scriptSetup, styles } = descriptor;
  if (!template || !template.ast) {
    console.warn("SFC does not contain a template.");
  }
  if (!scriptSetup) {
    console.warn("SFC does not contain a script setup.");
    return { code: sfcContent };
  }
  const templateAst = template?.ast;

  const usedVariables = getTemplateUsedVars(templateAst);
  const babelResult = removeUnusedVars(scriptSetup.content, usedVariables);

  const code = `<template>${template?.content ?? ""}</template>
<script${scriptSetup.setup ? " setup" : ""}${scriptSetup.lang ? ` lang="${scriptSetup.lang}"` : ""}>\n${
    babelResult.code
  }\n</script>
${
  styles
    ?.map(
      (style) =>
        `<style ${style.lang ? `lang="${style.lang}"` : ""}${style.scoped ? " scoped" : ""}>\n${
          style.content
        }\n</style>\n`
    )
    ?.join("\n") ?? ""
}`;

  // console.log("vue代码tree shake后的结果:\n", code);
  return { code, parse, descriptor, babelResult, usedVariables };
}
