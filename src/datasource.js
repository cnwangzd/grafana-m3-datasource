var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import isUndefined from 'lodash/isUndefined';
import map from 'lodash/map';
var GenericDatasource = /** @class */ (function () {
    /** @ngInject **/
    function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
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
    GenericDatasource.prototype.query = function (options) {
        var query = options;
        query.targets = this.buildQueryTargets(options);
        if (query.targets.length <= 0) {
            return this.q.when({ data: [] });
        }
        if (this.templateSrv.getAdhocFilters) {
            query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
        }
        else {
            query.adhocFilters = [];
        }
        options.scopedVars = __assign({}, this.getVariables(), options.scopedVars);
        return this.doRequest({
            url: this.url + '/query',
            data: query,
            method: 'POST',
        });
    };
    GenericDatasource.prototype.testDatasource = function () {
        return this.doRequest({
            url: this.url + '/',
            method: 'GET',
        }).then(function (response) {
            if (response.status === 200) {
                return { status: 'success', message: 'Data source is workingsfdsdf', title: 'Success' };
            }
            return {
                status: 'error',
                message: 'Data source is not working: ' + response.message,
                title: 'Error',
            };
        });
    };
    GenericDatasource.prototype.annotationQuery = function (options) {
        var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
        var annotationQuery = {
            annotation: {
                query: query,
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
        }).then(function (result) {
            return result.data;
        });
    };
    GenericDatasource.prototype.metricFindQuery = function (query) {
        var interpolated = {
            target: this.templateSrv.replace(query, null, 'regex'),
        };
        return this.doRequest({
            url: this.url + '/search',
            data: interpolated,
            method: 'POST',
        }).then(this.mapToTextValue);
    };
    GenericDatasource.prototype.mapToTextValue = function (result) {
        return map(result.data, function (d, i) {
            if (d && d.text && d.value) {
                return { text: d.text, value: d.value };
            }
            if (isObject(d)) {
                return { text: d, value: i };
            }
            return { text: d, value: d };
        });
    };
    GenericDatasource.prototype.doRequest = function (options) {
        options.withCredentials = this.withCredentials;
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    };
    GenericDatasource.prototype.buildQueryTargets = function (options) {
        var _this = this;
        return options.targets
            .filter(function (target) {
            // remove placeholder targets
            return target.target !== 'select metric';
        })
            .map(function (target) {
            var data = isUndefined(target.data) ? null : target.data;
            if (typeof data === 'string' && data.trim() === '') {
                data = null;
            }
            if (data !== null) {
                var match = data.match(/("(\$.+?)")/g);
                if (match !== null) {
                    data
                        .match(/("(\$.+?)")/g)
                        .map(function (match) {
                        var replacedMatch = _this.templateSrv.replace(match, options.scopedVars, 'json');
                        if (replacedMatch !== match) {
                            data = data.replace(match, replacedMatch.substring(1, replacedMatch.length - 1));
                        }
                    });
                }
                data = JSON.parse(data);
            }
            return {
                data: data,
                target: _this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
                refId: target.refId,
                hide: target.hide,
                type: target.type,
            };
        });
    };
    GenericDatasource.prototype.getVariables = function () {
        var index = isUndefined(this.templateSrv.index) ? {} : this.templateSrv.index;
        var variables = {};
        Object.keys(index).forEach(function (key) {
            var variable = index[key];
            var variableValue = variable.current.value;
            if (variableValue === '$__all' || isEqual(variableValue, ['$__all'])) {
                if (variable.allValue === null) {
                    variableValue = variable.options.slice(1).map(function (textValuePair) { return textValuePair.value; });
                }
                else {
                    variableValue = variable.allValue;
                }
            }
            variables[key] = {
                text: variable.current.text,
                value: variableValue,
            };
        });
        return variables;
    };
    GenericDatasource.prototype.getTagKeys = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.doRequest({
                url: _this.url + '/tag-keys',
                method: 'POST',
                data: options,
            }).then(function (result) {
                return resolve(result.data);
            });
        });
    };
    GenericDatasource.prototype.getTagValues = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.doRequest({
                url: _this.url + '/tag-values',
                method: 'POST',
                data: options,
            }).then(function (result) {
                return resolve(result.data);
            });
        });
    };
    return GenericDatasource;
}());
export { GenericDatasource };
//# sourceMappingURL=datasource.js.map