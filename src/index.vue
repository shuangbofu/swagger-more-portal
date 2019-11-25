<template>
  <div class="index-container">
    <div class="top-info" v-if="info">
      <a href="/" class="title">{{info.title}}</a>
      <div class="version-description">
        <span class="info-description">{{info.description}}</span>
        <span class="info-version">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;version:{{info.version}}</span>
      </div>
    </div>
    <div class="main-container">
      <div class="tags-container">
        <div class="filter-input">
          <el-input v-model="filterCondition" placeholder="输入方法名过滤">
            <i slot="suffix" class="el-input__icon el-icon-search"></i>
          </el-input>
        </div>
        <el-menu
          class="tags-menu"
          :default-active="openedApiIndex"
          :unique-opened="true"
          @open="handleOpen"
          @close="handleClose"
          @select="chooseApi"
        >
          <el-submenu :index="tag.name" v-for="tag in filterTags" :key="tag.name">
            <template slot="title">
              <span
                style="user-select:none; outline:none; text-overflow: ellipsis;white-space: nowrap;overflow:hidden;"
              >{{tag.name}}</span>
              <el-badge
                type="primary"
                style="margin-left: 12px; "
                :value="tag.apis.length"
                class="item"
              ></el-badge>
            </template>
            <el-menu-item v-for="api in tag.apis" :key="api.name" :index="api.name">
              <el-tooltip
                class="item"
                effect="light"
                :content="api.name.split('/')[2] +'（'+ api.summary+'）'"
                placement="right"
              >
                <div
                  style="user-select:none; text-overflow: outline:none; ellipsis;white-space: nowrap;overflow:hidden;"
                  :class="'method-name ' + (api.deprecated ? 'deprecated': '')"
                >{{api.summary}}</div>
              </el-tooltip>
            </el-menu-item>
          </el-submenu>
        </el-menu>
      </div>
      <div class="api-viewer-container" v-if="openedApiIndex!==''">
        <el-tabs
          v-model="openedApiIndex"
          type="card"
          closable
          @tab-click="changeApi"
          @tab-remove="removeTab"
        >
          <el-tab-pane
            v-for="api in apiTabs"
            :key="api.name"
            :label="api.summary.length < 12 ? api.summary : api.summary.substring(0,12) + '…'"
            :name="api.name"
          >
            <div class="api-content-container">
              <div class="api-info-item">
                <span class="info-item-key">接口名：</span>
                <span class="info-item-value">{{api.name.split('/')[1]}}</span>
                <span class="info-item-key">方法名：</span>
                <span
                  :class="'info-item-value method-name ' + (api.deprecated ? 'deprecated': '')"
                >{{api.name.split('/')[2]}} （{{api.summary}}）</span>
                <div v-if="api.description" style="padding-top: 10px;">
                  <span class="info-item-value" v-html="api.description"></span>
                </div>
              </div>
              <div class="api-parameters api-info-item">
                <el-table border :data="api.parameters">
                  <el-table-column prop="name" width="240" label="参数名称"></el-table-column>
                  <el-table-column prop="description" label="描述"></el-table-column>
                  <el-table-column prop="className" label="类名"></el-table-column>
                  <el-table-column prop="example" width="190" label="示例">
                    <template v-slot="scope">
                      <a
                        href="javascript:;"
                        v-if="data.definitions[exampleValue(scope.row)]"
                        @click="objectShow(exampleValue(scope.row), 'dialog')"
                      >{{exampleValue(scope.row)}}</a>
                      <span v-else>{{exampleValue(scope.row)}}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="required" width="60" label="必填">
                    <template v-slot="scope">{{scope.row.required ? '是': '否'}}</template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="api-info-item">
                <el-button size="medium" type="primary" @click="execute">调试</el-button>
                <el-button size="medium" @click="full(api)">全屏</el-button>
                <span
                  v-if="requestPreTimes[api.name]"
                  :class="'requestPreTime ' + (requestPreTimes[api.name] > 1000 ? 'error' : (requestPreTimes[api.name] > 300 ? 'warning' : ''))"
                >{{requestPreTimes[api.name]}}ms</span>
              </div>
              <span style="display: none;">{{test}}</span>
              <div class="api-info-item editors">
                <editor
                  v-model="requestDatas[api.name]"
                  lang="json"
                  theme="textmate"
                  width="38%"
                  height="500"
                  @init="editor => editorInit(false, editor)"
                />
                <editor
                  v-loading="loading"
                  style="margin-left: 2%"
                  v-model="responseDatas[api.name]"
                  lang="json"
                  theme="textmate"
                  width="60%"
                  height="500"
                  @init="editor => editorInit(true, editor)"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div v-else class="empty-container">
        <div class="title" v-if="info">{{info.title}}</div>
      </div>
    </div>
    <el-dialog top="5vh" :title="exampleRef.title" :visible.sync="dialogVisible" width="60%">
      <div class="ref-panel">
        <object-show :obj="exampleRef"></object-show>
      </div>
    </el-dialog>
    <el-dialog
      title="全屏调试"
      :visible.sync="fullDialogVisible"
      :fullscreen="true"
      width="100%"
      :show-close="false"
    >
      <div v-if="fullDialogVisible" style="padding: 10px 20px;">
        <div style="padding: 10px 0 20px 0;">
          <el-button size="medium" type="primary" @click="execute">调试</el-button>
          <el-button
            v-if="fullApi.parameters[0] && data.definitions[exampleValue(fullApi.parameters[0])]"
            size="medium"
            @click="objectShow(exampleValue(fullApi.parameters[0]), 'drawer')"
            type="normal"
          >详细参数</el-button>
          <el-button size="medium" @click="fullDialogVisible=false;">退出全屏</el-button>
          <span
            v-if="requestPreTimes[fullApi.name]"
            :class="'requestPreTime ' + (requestPreTimes[fullApi.name] > 1000 ? 'error' : (requestPreTimes[fullApi.name] > 300 ? 'warning' : ''))"
          >{{requestPreTimes[fullApi.name]}}ms</span>
        </div>
        <div class="editors" style="height: calc(100vh - 140px);">
          <editor
            v-model="requestDatas[fullApi.name]"
            lang="json"
            theme="textmate"
            width="38%"
            height="100%"
            @init="editor => editorInit(false, editor)"
          />
          <editor
            v-loading="loading"
            style="margin-left: 2%"
            v-model="responseDatas[fullApi.name]"
            lang="json"
            theme="textmate"
            width="60%"
            height="100%"
            @init="editor => editorInit(true, editor)"
          />
        </div>
      </div>
    </el-dialog>
    <el-drawer
      :title="exampleRef.title"
      :visible.sync="drawer"
      direction="rtl"
      :size="'60%'"
      :before-close="() => {this.drawer = false;}"
    >
      <div class="ref-panel">
        <object-show :obj="exampleRef"></object-show>
      </div>
    </el-drawer>
  </div>
</template>

<script>
const mock = true;
import mockData from "@/data.json";
import ObjectShow from "@/components/objectShow.vue";
export default {
  components: {
    editor: require("vue2-ace-editor"),
    ObjectShow
  },
  data() {
    return {
      fetchDefinitionTimes: [],
      drawer: false,
      requestPreTimes: [],
      filterCondition: "",
      fullApi: null,
      fullDialogVisible: false,
      loading: null,
      test: "  ",
      responseDatas: {},
      requestDatas: {},
      openedApiIndex: "",
      apiIndexes: [],
      data: {},
      tags: [],
      apis: [],
      dialogVisible: false,
      exampleRef: {}
    };
  },
  created() {
    this.init();
  },
  computed: {
    filterTags() {
      let result = [];
      this.tags.forEach(tag => {
        const apis = tag.apis.filter(
          api =>
            api.name
              .split("/")[2]
              .toLowerCase()
              .includes(this.filterCondition.toLowerCase()) ||
            api.summary
              .toLowerCase()
              .includes(this.filterCondition.toLowerCase())
        );
        if (apis.length > 0) {
          result.push({
            ...tag,
            apis: apis
          });
        }
      });
      return result;
    },
    info() {
      return this.data.info;
    },
    apiTabs() {
      return this.apis.filter(api => this.apiIndexes.includes(api.name));
    },
    exampleValue() {
      return row => {
        switch (row.type) {
          case "boolean":
            return false;
          case "string":
            return '""';
          case "integer":
            return 0;
          case "array":
            if (row.items.$ref) {
              return row.items.$ref.replace("#/definitions/", "");
            }
            const arrayType = row.items.type;
            if (arrayType === "string") {
              return '[""]';
            } else if (arrayType === "integer") {
              return "[0]";
            }
            return "";
          default:
            if (row.schema) {
              return row.schema.$ref.replace("#/definitions/", "");
            } else if (row.items && row.items.additionalProperties) {
              return row.items.additionalProperties.$ref.replace(
                "#/definitions/",
                ""
              );
            }
            return "";
        }
      };
    }
  },
  methods: {
    init() {
      // 初始化所有接口数据
      this.fetchData(data => {
        document.title = data.info.title;
        data.info.basePath = data.basePath;
        this.data = data;
        data.definitions = data.definitions || [];
        let tags = data.tags;
        let apis = [];
        for (let pathName in data.paths) {
          let path = data.paths[pathName].post;
          const api = {
            ...path,
            type: "post",
            name: pathName,
            parameters: path.parameters || []
          };
          path.tags.forEach(tagName => {
            let tag = tags.find(tag => tag.name === tagName);
            if (!tag.apis) {
              tag.apis = [];
            }
            tag.apis.push(api);
          });
          apis.push(api);
        }
        this.tags = tags;
        this.apis = apis;
        this.initLocalStorageCache();
      });
    },
    initLocalStorageCache() {
      // 初始化localStorage缓存的requestDatas
      this.requestDatas =
        JSON.parse(localStorage.getItem("requestDatas")) || {};

      // 初始化所有tab
      this.apiIndexes = JSON.parse(localStorage.getItem("apiIndexes")) || [];

      // 重新初始化所有tab的apiData
      this.apiIndexes.forEach(i => {
        this.initApiData(i);
      });

      // 初始化关闭前opend的tab的apiData
      const openedApiIndex = localStorage.getItem("openedApiIndex") || "";
      if (openedApiIndex !== "") {
        this.initApiData(openedApiIndex);
        this.openedApiIndex = openedApiIndex;
      }
    },
    fetchData(callback) {
      if (mock) {
        callback(mockData);
      } else {
        this.axios.get("/v2/api-docs?group=dubbo").then(res => {
          callback(res.data);
        });
      }
    },
    full(api) {
      this.fullApi = api;
      this.fullDialogVisible = true;
    },
    execute() {
      let requestData = "";
      try {
        const content = this.requestDatas[this.openedApiIndex];
        if (content != "") {
          requestData = JSON.parse(content);
        }
      } catch (e) {
        this.$message({
          type: "error",
          message: "请求体body格式错误"
        });
        return;
      }
      const url =
        this.info.basePath +
        this.apiTabs.find(item => item.name === this.openedApiIndex).name;
      this.loading = true;
      const start = new Date().getTime();

      // 请求前将requestData保存至localStorage
      // requestDatas stringify转化会异常所以暂时{{...}}处理
      localStorage.setItem(
        "requestDatas",
        JSON.stringify({ ...this.requestDatas })
      );
      // 请求接口
      this.axios
        .post(url, requestData)
        .then(res => {
          if (res.status !== 200) {
            this.$set(
              this.responseDatas,
              this.openedApiIndex,
              JSON.stringify(res.data, null, 2)
            );
            this.test = Math.random();
            this.$message({
              type: "error",
              message: res.status + " "
            });
          } else {
            this.test = Math.random();
            this.$set(
              this.responseDatas,
              this.openedApiIndex,
              JSON.stringify(res.data, null, 2)
            );
          }
          this.loading = null;
          // 计算保存每次请求的时间
          this.requestPreTimes[this.openedApiIndex] =
            new Date().getTime() - start;
        })
        .catch(msg => {
          this.$set(
            this.responseDatas,
            this.openedApiIndex,
            JSON.stringify(msg.response ? msg.response.data : msg, null, 2)
          );
          // 页面不渲染不刷新临时解决方案
          this.test = Math.random();
          this.$message({
            type: "error",
            message: "请求出错，" + (msg.response ? msg.response.data : msg)
          });
          this.loading = null;
          this.requestPreTimes[this.openedApiIndex] =
            new Date().getTime() - start;
        });
    },
    objectShow(name, type) {
      // 根据类名称获取类
      this.fetchDefinitionTimes = [];
      let ref = { ...this.data.definitions[name] };
      const obj = this.getParameterDefaultStructure(ref);
      this.exampleRef = obj;
      if (type === "dialog") {
        this.dialogVisible = true;
      } else if (type === "drawer") {
        this.drawer = true;
      }
    },
    handleOpen() {},
    handleClose() {},
    changeApi(val) {
      // 改变tab的时候保存opend tab
      this.openedApiIndex = val.name;
      localStorage.setItem("openedApiIndex", val.name);
    },
    chooseApi(val) {
      if (val === "") {
        return;
      }
      this.openedApiIndex = val;
      localStorage.setItem("openedApiIndex", val);

      if (!this.apiIndexes.includes(val)) {
        this.apiIndexes.push(val);
        localStorage.setItem("apiIndexes", JSON.stringify(this.apiIndexes));
      }
      this.initApiData(val);
    },
    initApiData(val) {
      if (val === "") {
        return;
      }
      // 初始化requestData
      if (!this.requestDatas[val]) {
        this.fetchDefinitionTimes = [];
        this.requestDatas[val] = this.initDefaultRequestData(val);
      }
      // 初始化responseData
      if (!this.responseDatas[val]) {
        // 每次重置取对象数
        this.fetchDefinitionTimes = [];
        const defaultResponse = this.apiTabs.find(item => item.name === val)
          .responses;
        let res;
        if (defaultResponse[200].schema) {
          res = this.getParameterDefaultValue(defaultResponse[200].schema);
        }
        this.responseDatas[val] = JSON.stringify(res, null, 2) || "";
      }
    },
    initDefaultRequestData(val) {
      const api = this.apiTabs.find(item => item.name === val);
      const parameters = api.parameters;
      if (!api.parameters) {
        return "";
      }
      let requestData = {};
      parameters.forEach(parameter => {
        if (parameter.in === "body") {
          requestData = this.getParameterDefaultValue(parameter);
          return JSON.stringify(requestData, null, 2);
        } else if (parameter.in === "query") {
          requestData[parameter.name] = this.getParameterDefaultValue(
            parameter
          );
        }
      });
      return JSON.stringify(requestData, null, 2);
    },
    getParameterDefaultStructure(parameter) {
      switch (parameter.type) {
        case "array":
          return {
            ...parameter,
            items: this.getParameterDefaultStructure(parameter.items)
          };
        case "object":
          if (parameter.additionalProperties) {
            parameter.type = "map";
            parameter.mapItem = this.getParameterDefaultStructure(
              parameter.additionalProperties
            );
            return parameter;
          }
          let obj = {};
          const _class = parameter;
          for (let key in _class.properties) {
            const propertyValue = _class.properties[key];
            obj[key] = this.getParameterDefaultStructure(propertyValue);
          }
          return { ..._class, properties: obj };
        default:
          if (parameter.$ref) {
            const _class = { ...this.getDefinitionObj(parameter.$ref) };
            return {
              type: "object",
              ...this.getParameterDefaultStructure(_class),
              object: _class
            };
          }
          return parameter;
      }
    },
    getParameterDefaultValue(parameter) {
      if (parameter.additionalProperties) {
        let map = {};
        map[""] = this.getParameterDefaultValue(parameter.additionalProperties);
        return map;
      }
      switch (parameter.type) {
        case "boolean":
          return false;
        case "integer":
          return 0;
        case "string":
          return "";
        // array
        case "array":
          let array = [];
          const items = parameter.items;
          if (
            this.fetchDefinitionTimes[items.$ref] &&
            this.fetchDefinitionTimes[items.$ref] > 2
          ) {
            return array;
          }

          const obj = this.getParameterDefaultValue(items);
          if (obj !== undefined && obj !== null) {
            array.push(obj);
          }
          return array;
        case "object":
          // allOf
          if (parameter.allOf) {
            let arr = [];
            parameter.allOf.forEach(i => {
              arr.push(this.getParameterDefaultValue(i));
            });
            return arr;
            // normal object
          } else if (parameter.additionalProperties) {
            return this.getParameterDefaultValue(
              parameter.additionalProperties
            );
          } else {
            const _class = parameter;
            let obj = {};
            if (_class.properties) {
              for (let key in _class.properties) {
                const propertyValue = _class.properties[key];
                obj[key] = propertyValue.example
                  ? propertyValue.example
                  : this.getParameterDefaultValue(propertyValue);
              }
              return obj;
            }
          }
        default:
          if (!parameter.type) {
            // ref
            if (parameter.$ref) {
              let _class = this.getDefinitionObj(parameter.$ref);
              _class.type = "object";
              return this.getParameterDefaultValue({ ..._class });
            } else if (parameter.schema) {
              return this.getParameterDefaultValue(parameter.schema);
              // Map
            } else if (parameter.items) {
              return this.getParameterDefaultValue(parameter.items);
            }
          }
      }
    },
    getDefinitionObj(refName) {
      if (!this.fetchDefinitionTimes[refName]) {
        this.fetchDefinitionTimes[refName] = 0;
      }
      // 递归嵌套取对象在取对象的时候做限制
      this.fetchDefinitionTimes[refName] += 1;
      if (refName.includes(".")) {
        refName = refName.slice(refName.lastIndexOf(".") + 1);
      }
      const obj = this.data.definitions[refName.replace("#/definitions/", "")];
      if (this.fetchDefinitionTimes[refName] > 1) {
        return {
          title: obj.title
        };
      }
      return obj;
    },
    removeTab(val) {
      const index = this.apiIndexes.findIndex(index => index === val);
      if (index !== -1) {
        if (index - 1 >= 0) {
          this.openedApiIndex = this.apiIndexes[index - 1];
        } else if (index + 1 <= this.apiIndexes.length - 1) {
          this.openedApiIndex = this.apiIndexes[index + 1];
        } else {
          this.openedApiIndex = "";
        }
        this.apiIndexes.splice(index, 1);

        this.requestDatas[val] = undefined;
        this.responseDatas[val] = undefined;
        this.requestPreTimes[val] = undefined;
        localStorage.setItem("apiIndexes", JSON.stringify(this.apiIndexes));
        localStorage.setItem("openedApiIndex", this.openedApiIndex);
      }
    },
    editorInit: function(readOnly, editor) {
      require("brace/ext/language_tools"); // language extension prerequsite...
      require("brace/ext/beautify");
      require("brace/mode/html");
      require("brace/mode/json");
      require("brace/mode/javascript"); // language
      require("brace/mode/sql");
      require("brace/mode/less");
      require("brace/theme/chrome");
      require("brace/theme/sqlserver");
      require("brace/theme/xcode");
      require("brace/snippets/javascript"); // snippet

      editor.setOptions({
        readOnly: readOnly,
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true // 设置自动提示
      });
    }
  }
};
</script>

<style lang="scss">
.index-container {
  padding: 0 20px;
  background-color: #f6f6f6;
  overflow: hidden;
  .title {
    font-size: 32px;
    font-family: "lucida grande", "lucida sans unicode", lucida, helvetica,
      "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
    line-height: 70px;
    color: #409eff;
    font-weight: bold;
    text-decoration: none;
  }
  .top-info {
    display: flex;
    padding-bottom: 10px;
    height: 70px;
    box-sizing: border-box;
    justify-content: space-between;
    .info-title {
      color: #444;
      font-size: 48px;
      font-weight: 400;
      margin-bottom: 15px;
    }
    .version-description {
      line-height: 90px;
      margin-left: 30px;
      user-select: none;
      .info-description {
        color: #777;
        font-size: 15px;
        font-weight: 600;
      }
      .info-version {
        color: #999;
        font-size: 14px;
        margin-right: 1px;
      }
    }
  }
  .main-container {
    background-color: #fff;
    display: flex;
    height: calc(100vh - 90px);
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.09);
    .tags-container {
      position: relative;
      width: 240px;
      min-width: 240px;
      height: calc(100% - 30px);
      overflow: hidden;
      padding: 10px 0 10px 10px;
      .filter-input {
        position: absolute;
        top: 0;
        width: calc(100% - 10px);
        padding: 10px 10px 10px 0;
        .el-input__inner {
          border-radius: 0;
        }
      }
      .tags-menu {
        margin-top: 50px;
        overflow: auto;
        height: calc(100% - 40px);
      }
      .method-name {
        &.deprecated {
          text-decoration: line-through;
        }
      }
      .el-menu {
        border-right: none;
        .el-submenu .el-menu-item {
          overflow: hidden;
        }
        .el-submenu__title {
          font-size: 16px;
        }
      }
    }
    .api-viewer-container {
      height: calc(100% - 30px);
      width: calc(100% - 240px);
      overflow: hidden;
      padding: 20px;
      .el-tabs--card > .el-tabs__header {
        .el-tabs__item:first-child {
          border-left: none;
        }
        .el-tabs__nav {
          border-radius: 0 !important;
        }
      }
      .el-tabs__nav-prev,
      .el-tabs__nav-next {
      }
      .api-content-container {
        padding-top: 10px;
        padding-bottom: 0;
        overflow: auto;
        height: calc(100vh - 190px);
        box-sizing: border-box;
        .api-info-item {
          &.api-parameters,
          &.editors {
            margin-right: 10px;
          }
        }
        .method-name {
          &.deprecated {
            text-decoration: line-through;
          }
        }
        .api-info-item {
          margin-bottom: 20px;
          .info-item-key {
            font-weight: 600;
          }
          .info-item-value {
            color: #666;
            font-size: 15px;
            margin-right: 40px;
          }
          .el-table {
            table {
              thead {
                th > .cell {
                  font-weight: 600;
                  color: #666 !important;
                }
              }
            }
          }
        }
      }
    }
    .empty-container {
      padding: 40px;
      .title {
        margin-top: 50px;
        font-size: 100px;
        font-weight: 600;
        color: #f2f2f2;
        user-select: none;
      }
    }
  }
  .el-dialog {
    .el-dialog__title {
      display: block;
      line-height: 24px;
      font-size: 18px;
      color: #303133;
      margin-right: 20px;
      word-break: break-all;
    }
    .el-dialog__body {
      padding: 0;
    }
  }
  .editors {
    display: flex;
    margin-bottom: 0 !important;
    justify-content: space-between;
  }
  .requestPreTime {
    user-select: none;
    float: right;
    line-height: 40px;
    font-size: 15px;
    color: #0abf5b;
    margin-right: 10px;
    &.warning {
      color: #ffb800;
    }
    &.error {
      color: rgb(239, 83, 80);
    }
  }
}
.ref-panel {
  padding: 40px;
  .ref-content {
    white-space: pre-wrap;
    line-height: 22px;
    font-size: 16px;
    color: #222;
  }
}
.el-drawer__body {
  overflow: auto;
}

.el-button {
  border-radius: 0 !important;
}
.el-drawer__header {
  word-break: break-all;
  margin-bottom: 0 !important;
}
.el-dialog__header {
  padding-top: 15px !important;
  background-color: #fafafa;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  border-bottom: 1px solid #e6e6e6;
}
.ace_print-margin {
  visibility: hidden !important;
}
</style>
