<template>
  <div class="obj">
    <div
      @click="unfold = !unfold"
      v-if="obj.title && curCount >1"
      style=" cursor: pointer; user-select:none; color:#0abf5b; font-weight: 700; margin-top: 10px;margin-bottom: 16px;"
    >
      Object
      <i style="font-weight:700;" :class="unfold?'el-icon-arrow-down':'el-icon-arrow-right'"></i>
    </div>
    <div class="description" v-if="obj.description && (unfold || curCount ===1)">
      <div class="name">description:</div>
      <span>{{obj.description}}</span>
    </div>
    <template v-if="(unfold || curCount ===1)">
      <div v-for="(info, name) in obj.properties" :key="name" class="property">
        <div class="name">
          {{name}}
          <span
            style="color: rgb(239, 83, 80);"
          >{{(obj.required && obj.required.includes(name)) ? '*':''}}</span>
        </div>
        <div class="info">
          <div class="key-value" v-for="(value, key) in info" :key="key" :class="key">
            <div v-if="key === 'type'">
              <span v-if="value!=='object'">{{value}}</span>
              <span v-if="info['format']" style="color:#888;">&nbsp;(${{info['format']}})</span>
              <span
                style="color:#888;"
                v-if="value=='array' && info['items'] && (info['items'].title || info['items'].type || info['items'].$ref)"
              >&nbsp;({{info['items'].title || info['items'].type || info['items'].$ref.replace('#/definitions/','')}})</span>
              <span
                v-if="value==='object' && info['object'] && info['object'].title"
              >({{info['object'].title}})</span>
              <span
                style="color:#888;"
                v-if="value==='map' && info['mapItem'] && info['mapItem'].title"
              >&nbsp;(string, {{info['mapItem'].title}})</span>
            </div>
            <div v-else-if="key === 'example'">example: {{value}}</div>
            <div v-else-if="key === 'enum'">
              <span style="font-weight: 600;margin-top: 4px;">Enum:</span>
              <span style="margin-top: 4px;">
                [
                <span v-for="(item, index) in info['enum']" :key="index">
                  {{item}}
                  <span v-if="index < info['enum'].length -1">,</span>
                  &nbsp;
                </span>]
              </span>
            </div>
            <div v-else-if="key === 'object'">
              <object-show :count="curCount" :obj="info['object']" style="margin-top:10px;"></object-show>
            </div>
            <div v-else-if="key === 'items'">
              <object-show :count="curCount" :obj="info['items']" style="margin-top:10px;"></object-show>
            </div>
            <div v-else-if="key === 'mapItem'">
              <object-show :count="curCount" :obj="info['mapItem']" style="margin-top:10px;"></object-show>
            </div>
            <div v-else-if="key === '$ref'" style="display:none;"></div>
            <div v-else-if="key === 'required'" style="display:none;"></div>
            <div v-else-if="key === 'title'" style="display:none;"></div>
            <div v-else-if="key === 'properties'" style="display:none;"></div>
            <div v-else-if="key === 'additionalProperties'" style="display:none;"></div>
            <div v-else>{{value}}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: ["obj", "count"],
  data() {
    return {
      unfold: false
    };
  },
  components: { ObjectShow: () => import("@/components/objectShow.vue") },
  computed: {
    curCount() {
      // TODO 暂时不需要
      return (this.count || 0) + 1;
    }
  }
};
</script>

<style lang="scss">
.obj {
  .description {
    color: #555;
    font-size: 16px;
    font-weight: 600;
    font-style: italic;
    margin-bottom: 20px;
    .name {
      display: inline-block;
      width: 210px;
    }
  }
  .property {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    margin-bottom: 10px;
    font-size: 16px;
    .name {
      width: 210px;
      min-width: 210px;
      color: #333;
      font-weight: 600;
    }
    .info {
      .key-value {
        margin-bottom: 12px;
        margin-right: 18px;
        &.type {
          color: #0e70d1;
          font-weight: 600;
        }
        &.description {
          color: #666;
          font-weight: 700;
        }
        &.format {
          display: none;
        }
        &.example {
          font-style: italic;
          color: #888;
        }
        &.type,
        &.example,
        &.enum,
        &.description {
          display: inline-block;
        }
      }
    }
  }
}
</style>