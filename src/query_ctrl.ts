import { QueryCtrl } from 'grafana/app/plugins/sdk';
import extend from 'lodash/extend';
import find from 'lodash/find';
import isObject from 'lodash/isObject';

export class GenericDatasourceQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  private types: any;
  private showJSON: boolean;
  private showMxWhere: boolean;
  private mxClass: any;
  private mxAttribute: any;

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);


    this.target.hide = false;
    this.target.target = this.target.target || 'select metric';
    
    if (!this.target.type) {
      this.target.type = this.panelCtrl.panel.type === 'table' ? 'table' : 'timeseries';
    }
    
    this.target.data = this.target.data || '';
    this.target.mxWhere = this.target.mxWhere || '';

    this.types = [
      { text: 'Time series', value: 'timeseries' },
      { text: 'Table', value: 'table' },
    ]; 
    
    this.requestMxClass().then(response => {
        extend(this, {mxClass: response.data});
        this.mxClass = this.mxClass;
    });

    this.showJSON = false;
    this.showMxWhere = false;
  }

  requestMxClass() {  // 请求获取参数列表
    return this.datasource.doRequest({
        url: this.datasource.url + `/script/exec/js?input=null&isfile=true&rawdata=true&filepath=/grafana/getClass.js`,
        method: 'POST',
    });
  }

  getOptions(query) {
    return this.datasource.metricFindQuery(query || '');
  }

  // not used
  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    var tmp = find(this.mxClass,{value:this.target.mxClass});
    if (tmp) {
        this.mxAttribute = tmp['attribute'];
    }

    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }


}
