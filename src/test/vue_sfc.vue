<template>
  <div v-if="ccc"></div>
  <div v-else-if="vvv"></div>
  <div :fodr="testFunc()"> {{ testFunc111() + vvv }} </div>
  <div>{{ `Hello ${name ? name : 'World'}!` }}</div>
  <div v-for="(item, index) in obj"> {{ item }} --{{ index }}</div>
  <div
    v-if="!pageLoading.loading && visible"
    class="page_root"
    data-page-name="大大撒旦发"
    :data-page-identification="arr"
    :ccc="{
      a: aa,
      b: cc,
      c: 300,
    }"
    :arrTmp="[1, b, a]"
  >
    <a-spin :spinning="pageLoading.loading" :tip="pageLoading.tip">
      <!-- begin vid_lsa4kvr3uy 按钮_uzqiji34mo -->
      <a-button class="vid_lsa4kvr3uy"> 按钮 </a-button>
      <!-- end vid_lsa4kvr3uy 按钮_uzqiji34mo -->
      <!-- begin vid_cw92pfksav 表单容器_ochhvc7cw9 -->
      <a-form
        class="vid_cw92pfksav"
        :model="s_w77mtj7a8u"
        :formModel="vid_cw92pfksav_props.formModel"
      >
        <!-- begin vid_tmip3klidg 表单项容器_st07om3n3d -->
        <a-form-item
          name="h_71gxk8n703"
          :rules="s_w77mtj7a8u_rules[`h_71gxk8n703`]"
          class="vid_tmip3klidg"
          :label-col="{ span: 8 }"
          :wrapper-col="{ span: 16 }"
        >
          <!-- begin vid_fwdxi8bubq 输入框_zryexx2p3s -->
          <a-input class="vid_fwdxi8bubq" v-model:value="s_w77mtj7a8u.h_71gxk8n703"> </a-input>
          <!-- end vid_fwdxi8bubq 输入框_zryexx2p3s -->
          <template #label>
            <!-- begin vid_c74eejwd33 简单文本_pyzjcagce3 -->
            <span class="vid_c74eejwd33"> 文本 </span>
            <!-- end vid_c74eejwd33 简单文本_pyzjcagce3 -->
          </template>
        </a-form-item>
        <!-- end vid_tmip3klidg 表单项容器_st07om3n3d -->
      </a-form>
      <!-- end vid_cw92pfksav 表单容器_ochhvc7cw9 -->
    </a-spin>
    <div v-for="(item, index) in arr"> {{ item }} --{{ index }}</div>
  </div>
</template>
<script setup>
  import {
    h,
    ref,
    reactive,
    toRaw,
    markRaw,
    watch,
    computed,
    onBeforeMount,
    onMounted,
    onBeforeUnmount,
    onUnmounted,
    onActivated,
    onDeactivated,
  } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  const router = useRouter();
  const route = useRoute();
  import { get, post, put, del, request, requestWithHeaders } from '@/utils/http/Axios';
  import {
    cloneDeep,
    isNullOrEmpty,
    isEmptyArr,
    isNullOrUnDef,
    localGet,
    isContained,
    isArray,
    isEmpty,
    merge,
    getDifferenceArray,
    isObject,
    traversalTreeStructure,
    checkCaseCondition,
    renderStringInTemplate,
    handleBreadcrumbJump,
    throttle,
  } from '@/utils/index';
  import dayjs from 'dayjs';
  import { getPagePcChartsDataSourceConvert } from '@/utils/chart';
  import { message, notification, Modal } from 'ant-design-vue';
  import {
    propertyFormatByNumber,
    propertyFormatByPercentage,
    propertyFormatByDate,
  } from '@/utils/format';
  /*** PUBLISH_EXEGESIS ***
    import UserTableRecords from '@/model/UserTableRecords';
    *** PUBLISH_EXEGESIS ***/
  // let { aa, bb } = dayjs;
  // let [cc, dd] = bbb;
  // const b = 1;
  // var a = 1;
  // let c = 'dddddd';
  // // console.log(b, aa, cc);
  // const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // const obj = {
  //   a: 100,
  //   b: 200,
  //   c: 300,
  // };
  // const visible = ref(false);
  // 获取传入的流程ID
  let props = defineProps({
    processInstanceId: {
      type: String,
    },
  });
  // const immediateWatch = (source, callback) => {
  //   watch(source, callback, { deep: true, immediate: true });
  // };

  /* -------------------------- 属性定义 -------------------------- */

  // const setTimeOutList = [];
  // const pageLoading = reactive({
  //   loading: false,
  //   tip: undefined,
  // });

  // const vid_cw92pfksav_props = reactive({
  //   formModel: { h_71gxk8n703: '' },
  // });

  // const vid_fwdxi8bubq_props = reactive({
  //   value: '',
  // });
  // // ---------------------------- 定义模型数据 ----------------------------

  // const s_w77mtj7a8u = reactive({ h_71gxk8n703: '' });

  // // ============================ 定义模型数据 ============================

  // const s_w77mtj7a8u_rules = reactive({});

  // // 处理校验
  // const setSubFormName = (parentInfo, name) => {
  //   return [parentInfo.parents, parentInfo.cycleIndex, name];
  // };

  /* ========================== 属性定义 ========================== */

  /* -------------------------- 元素数据引用 -------------------------- */

  /* ========================== 元素数据引用 ========================== */

  /* -------------------------- 页面数据 -------------------------- */

  /* ========================== 页面数据 ========================== */

  /* -------------------------- 响应 -------------------------- */

  /* ========================== 响应 ========================== */

  /* -------------------------- 函数 -------------------------- */

  /* ========================== 函数 ========================== */

  /* -------------------------- 页面参数 -------------------------- */

  const pageParameter_state = reactive({
    processInstanceId: props.processInstanceId,
  });

  /* ========================== 页面参数 ========================== */

  /* -------------------------- 组件事件处理方法 -------------------------- */

  // ---------------------------- 组件数据同步 ----------------------------

  // ============================ 组件数据同步 ============================

  /* ========================== 组件事件处理方法 ========================== */

  /* -------------------------- 生命周期 -------------------------- */
  onMounted(() => {});

  // onUnmounted(() => {
  //   // 销毁定时器
  //   setTimeOutList.forEach(({ repeat, timer }) => {
  //     repeat ? clearInterval(timer) : clearTimeout(timer);
  //   });
  // });

  /* ========================== 生命周期 ========================== */

  /* -------------------------- 数据关联处理 -------------------------- */

  /* -------------------------- 表单数据同步 -------------------------- */
  /* ========================== 表单数据同步 ========================== */

  /* ========================== 数据关联处理 ========================== */

  /* -------------------------- 不同组件自定义的处理逻辑 -------------------------- */

  /* ========================== 不同组件自定义的处理逻辑 ========================== */

  // ================================定制化逻辑========================================
  props = defineProps({
    processInstanceId: {
      type: String,
    },
    nnnn: {
      type: String,
    },
  });
</script>
<style lang="less" scoped>
  .page_root {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
  .page_root :deep(.@{ant-prefix}-spin-nested-loading),
  .page_root :deep(.@{ant-prefix}-spin-container) {
    height: 100%;
  }
  .table-moreBtn_down {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100px;
  }

  .table-moreBtn_menu :deep(.table-moreBtn_menu-item):hover {
    background: #ebf1ff;
  }

  /*  表格树结构样式处理，展开按钮层级增加*/
  :deep(.@{ant-prefix}-table-row-expand-icon) {
    z-index: 1;
  }
  /*  表格树结构 由于每个表格项采用自定义组件，使用绝对定位布局，开启树结构导致显示异常，暂时使用层级定位位置 */
  :deep(.@{ant-prefix}-table-row-level-1 .ant-table-cell-with-append .cell-wrapper-left) {
    left: 15px !important;
    width: calc(100% - 15px);
  }
  :deep(.@{ant-prefix}-table-row-level-2 .ant-table-cell-with-append .cell-wrapper-left) {
    left: 30px !important;
    width: calc(100% - 30px);
  }
  :deep(.@{ant-prefix}-table-row-level-3 .ant-table-cell-with-append .cell-wrapper-left) {
    left: 45px !important;
    width: calc(100% - 45px);
  }
  :deep(.@{ant-prefix}-table-row-level-4 .ant-table-cell-with-append .cell-wrapper-left) {
    left: 60px !important;
    width: calc(100% - 60px);
  }

  /* 穿梭框改变默认样式，为根据组件样式控制左右栏宽度。 */
  :deep(.@{ant-prefix}-transfer-list) {
    height: 100%;
    width: 50%;
  }
</style>
