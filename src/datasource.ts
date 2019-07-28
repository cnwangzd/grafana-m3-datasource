///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import isUndefined from 'lodash/isUndefined';
import extend from 'lodash/extend';
import delay from 'lodash/delay';
import map from 'lodash/map';

export class GenericDatasource {

  name: string;
  url: string;
  q: any;
  backendSrv: any;
  templateSrv: any;
  withCredentials: boolean;
  headers: any;

  /** @ngInject **/
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options) {
    
    const query = options;
    console.log(1233,options)
    query.targets = this.buildQueryTargets(options);
    
    if (query.targets.length <= 0) {
      return this.q.when({ data: [] });
    }

    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }

    options.scopedVars = { ...this.getVariables(), ...options.scopedVars };


    return this.doRequest({
        url: this.url + `/script/exec/js?input=${encodeURIComponent(JSON.stringify(query))}&isfile=true&rawdata=true&filepath=/grafana/getPerformanceList.js`,
        //data: query,
        method: 'POST',
    });
  }

  testDatasource() {
    return this.doRequest({
      url: this.url,
      method: 'GET',
    }).then((response) => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source is workings', title: 'Success' };
      }

      return {
        status: 'error',
        message: 'Data source is not working: ' + response.message,
        title: 'Error',
      };
    });
  }

  annotationQuery(options) {
    const query = this.templateSrv.replace(options.annotation.query, {}, 'glob');

    const annotationQuery = {
      annotation: {
        query,
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
      },
      range: options.range,
      rangeRaw: options.rangeRaw,
      variables: this.getVariables(),
    };

    return this.doRequest({
      url: this.url + '/annotations',
      method: 'POST',
      data: annotationQuery,
    }).then((result) => {
      return result.data;
    });
  }

  metricFindQuery(query) {
    
    const interpolated = {
      target: this.templateSrv.replace(query, null, 'regex'),
    };
    
    return this.doRequest({
      url: this.url + `/script/exec/js?input=${encodeURIComponent(JSON.stringify(interpolated))}&isfile=true&rawdata=true&filepath=/grafana/getMeta.js`,//}/search`,
      //data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  mapToTextValue(result) {
    return result.data.map((d, i) => {
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      }

      if (isObject(d)) {
        return { text: d, value: i };
      }
      return { text: d, value: d };
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
    
  }

  buildQueryTargets(options) {
    return options.targets
      .filter((target) => {
        // remove placeholder targets
        return target.target !== 'select metric';
      })
      .map((target) => {
        
        let data = isUndefined(target.data) ? null : target.data;

        if (typeof data === 'string' && data.trim() === '') {
          data = null;
        }

        if (data !== null) {
          const match = data.match(/("(\$.+?)")/g);
          if (match !== null) {
            data
              .match(/("(\$.+?)")/g)
              .map((match: string) => {
                const replacedMatch = this.templateSrv.replace(match, options.scopedVars, 'json');
                if (replacedMatch !== match) {
                  data = data.replace(match, replacedMatch.substring(1, replacedMatch.length - 1));
                }
              });
          }

          data = JSON.parse(data);
        }
        
        let mxWhere = isUndefined(target.mxWhere) ? null : target.mxWhere;

        if (typeof mxWhere === 'string' && mxWhere.trim() === '') {
          mxWhere = null;
        }

        console.log(99,target)
        return {
          data,
          target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
          refId: target.refId,
          hide: target.hide,
          type: target.type,
          mxClass: target.mxClass,
          mxAttribute: target.mxAttribute,
          mxTime:  target.mxTime,
          mxValue:  target.mxValue,
          mxWhere
        };
      });
  }

  getVariables() {
    const index = isUndefined(this.templateSrv.index) ? {} : this.templateSrv.index;
    const variables = {};
    Object.keys(index).forEach((key) => {
      const variable = index[key];

      let variableValue = variable.current.value;
      if (variableValue === '$__all' || isEqual(variableValue, ['$__all'])) {
        if (variable.allValue === null) {
          variableValue = variable.options.slice(1).map(textValuePair => textValuePair.value);
        } else {
          variableValue = variable.allValue;
        }
      }

      variables[key] = {
        text: variable.current.text,
        value: variableValue,
      };
    });

    return variables;
  }

  getTagKeys(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + `/script/exec/js?input=${encodeURIComponent(JSON.stringify(options))}&isfile=true&rawdata=true&filepath=/grafana/getTagKeys.js`,//tag-keys',
        method: 'POST',
        //data: options,
      }).then((result) => {
        console.log(111,resolve(result.data));
        return resolve(result.data);
      });
    });
  }

  getTagValues(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + `/script/exec/js?input=${encodeURIComponent(JSON.stringify(options))}&isfile=true&rawdata=true&filepath=/grafana/getTagValues.js`,//tag-values',
        method: 'POST',
        //data: options,
      }).then((result) => {
        console.log(222,resolve(result.data));
        return resolve(result.data);
      });
    });
  }

}
