var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { QueryCtrl } from 'grafana/app/plugins/sdk';
var GenericDatasourceQueryCtrl = /** @class */ (function (_super) {
    __extends(GenericDatasourceQueryCtrl, _super);
    /** @ngInject **/
    function GenericDatasourceQueryCtrl($scope, $injector) {
        var _this = _super.call(this, $scope, $injector) || this;
        _this.target.hide = false;
        _this.target.target = _this.target.target || 'select metric';
        if (!_this.target.type) {
            _this.target.type = _this.panelCtrl.panel.type === 'table' ? 'table' : 'timeseries';
        }
        _this.target.data = _this.target.data || '';
        _this.types = [
            { text: 'Time series', value: 'timeseries' },
            { text: 'Table', value: 'table' },
        ];
        _this.showJSON = false;
        return _this;
    }
    GenericDatasourceQueryCtrl.prototype.getOptions = function (query) {
        return this.datasource.metricFindQuery(query || '');
    };
    // not used
    GenericDatasourceQueryCtrl.prototype.toggleEditorMode = function () {
        this.target.rawQuery = !this.target.rawQuery;
    };
    GenericDatasourceQueryCtrl.prototype.onChangeInternal = function () {
        this.panelCtrl.refresh(); // Asks the panel to refresh data.
    };
    GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
    return GenericDatasourceQueryCtrl;
}(QueryCtrl));
export { GenericDatasourceQueryCtrl };
//# sourceMappingURL=query_ctrl.js.map