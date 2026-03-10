import { parse } from "@vue/compiler-sfc";
import type { SFCDescriptor, SFCBlock } from "@vue/compiler-sfc";
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
function removeUnusedVars(scriptCode: string, usedVariables: Set<string>, lang?: string) {
  const options: Record<string, unknown> = {
    plugins: [[babelPluginShakeVueScript, { referencedIdentifiers: usedVariables }]],
  };
  // TypeScript 支持
  if (lang === "ts" || lang === "tsx") {
    options.filename = `file.${lang}`;
    options.presets = ["typescript"];
  }

  const result = BabelTransform(scriptCode, options);
  return result;
}

// 重建 SFC block 的属性字符串
function buildBlockAttrs(block: SFCBlock, overrideAttrs?: Record<string, string | true>): string {
  const attrs = { ...block.attrs, ...overrideAttrs };
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (value === true) return key;
      return `${key}="${value}"`;
    })
    .join(" ");
}

// 完整重组装 SFC
function reconstructSFC(descriptor: SFCDescriptor, newScriptContent: string): string {
  const parts: string[] = [];

  // template
  if (descriptor.template) {
    const attrs = buildBlockAttrs(descriptor.template);
    parts.push(`<template${attrs ? " " + attrs : ""}>${descriptor.template.content}</template>`);
  }

  // script setup (使用新内容)
  if (descriptor.scriptSetup) {
    const attrs = buildBlockAttrs(descriptor.scriptSetup);
    parts.push(`<script${attrs ? " " + attrs : ""}>\n${newScriptContent}\n</script>`);
  }

  // script (非 setup，原样保留)
  if (descriptor.script) {
    const attrs = buildBlockAttrs(descriptor.script);
    parts.push(`<script${attrs ? " " + attrs : ""}>${descriptor.script.content}</script>`);
  }

  // styles
  if (descriptor.styles?.length) {
    for (const style of descriptor.styles) {
      const attrs = buildBlockAttrs(style);
      parts.push(`<style${attrs ? " " + attrs : ""}>${style.content}</style>`);
    }
  }

  // 自定义块（如 <i18n>, <docs> 等）
  if (descriptor.customBlocks?.length) {
    for (const block of descriptor.customBlocks) {
      const attrs = buildBlockAttrs(block);
      parts.push(`<${block.type}${attrs ? " " + attrs : ""}>${block.content}</${block.type}>`);
    }
  }

  return parts.join("\n");
}

/**
 * 根据模板中的变量使用情况 对script部分执行Tree Shaking
 * @param sfcContent vue文件内容
 * @returns
 */
export function treeShakeVueSFC(sfcContent: string) {
  const { descriptor } = parse(sfcContent);
  const { template, scriptSetup } = descriptor;
  if (!template || !template.ast) {
    console.warn("SFC does not contain a template.");
  }
  if (!scriptSetup) {
    console.warn("SFC does not contain a script setup.");
    return { code: sfcContent };
  }
  const templateAst = template?.ast;

  const usedVariables = getTemplateUsedVars(templateAst);
  const babelResult = removeUnusedVars(scriptSetup.content, usedVariables, scriptSetup.lang);

  const code = reconstructSFC(descriptor, babelResult.code ?? "");

  return { code, parse, descriptor, babelResult, usedVariables };
}
