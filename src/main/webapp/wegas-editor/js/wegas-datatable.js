/**
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-datatable', function(Y) {

    var CONTENTBOX = 'contentBox',

    DataTable = Y.Base.create("wegas-datatable", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

	_dataSource: null,
	_pushButton: null,
	_table: null,

	initializer: function(cfg) {
	    this._dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
	},

	renderUI: function () {
	    var cb = this.get(CONTENTBOX);

	    this._table = new Y.DataTable({				// Instantiate the data table
		columns: this.get('columnset')
	    });
	    this._table.plug(Y.Plugin.DataTableDataSource, {
		datasource: this._dataSource
		//initialRequest: "/"
	    });
	    this._table.render(cb);
	},
	bindUI: function() {
            return;
            
	    var that = this;
	    this._dataSource.after("response", function (e) {			// Listen for datasource updates
		this._table.set('recordset', e.data);
	    }, this);

	    Y.delegate('click', function(e) {					// Listen for click events on the table
		var target = e.currentTarget,
		record = this._table.getRecord(target.ancestor('tr').get('id'));

		//cellIndex = Y.Node.getDOMNode(target).cellIndex,
		//columnSet = this.get('columnset');
		//col = columnSet._conf.data.value.definitions[cellIndex],
		//name= recordSet.get(target.ancestor('tr').get('id')).getValue('name');

		this._dataSource.rest.getById(record.get('id'));

		this._dataSource.once('response', function(e) {
		    Y.Wegas.editor.edit(e.response.results[0], function(cfg) {
			that._dataSource.rest.put(cfg);
		    });
		})

	    }, this.get(CONTENTBOX), 'td', this);
	},
	syncUI: function() {
	}
    }, {
	ATTRS : {
	    classTxt: {
		value: 'DataTable'
	    },
	    type: {
		value: "DataTable"
	    },
	    columnset: {},
	    dataSource: {}
	}
    });

    Y.namespace('Wegas').DataTable = DataTable;
});