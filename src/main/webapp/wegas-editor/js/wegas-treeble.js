/**
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-treeble', function(Y) {

    var CONTENTBOX = 'contentBox',
    YAHOO = Y.YUI2,

    Treeble = Y.Base.create("wegas-treeble", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        _dataSource: null,
        _pushButton: null,
        _table: null,

        initializer: function() {
            this._dataSource = Y.Wegas.app[this.get('dataSource')+"DataSource"];
        },

        renderUI: function () {
            var cb = this.get(CONTENTBOX);

            /* this._pushButton = new YAHOO.widget.Button({			//Instantiate the "New" button
		label:"New",
		container:cb._node
	    });

	    this._table = new Y.DataTable.Base({				// Instantiate the data table
		columnset: this.get('columnset'),
		plugins: [ Y.Plugin.DataTableSort ]
	    });
	    this._table.plug(Y.Plugin.DataTableDataSource, {
		datasource: this._dataSource,
		initialRequest: "/"
	    });
	    this._table.render(cb);*/
           /* var my_data = [{id:"22", quan:"mm"}];

            // treeble config to be set on root datasource

            var schema =
            {
                resultFields:
                [
                "id","quantity","year","title",
                {
                    key: 'kiddies',
                    parser: 'treebledatasource'
                }
                ]
            };

            var schema_plugin_config =
            {
                fn:  Y.Plugin.DataSourceArraySchema,
                cfg: {
                    schema:schema
                }
            };

            var treeble_config =
            {
                generateRequest:        function() { },
                schemaPluginConfig:     schema_plugin_config,
                childNodesKey:          'kiddies',
                totalRecordsReturnExpr: '.meta.totalRecords'
            };

            // root data source

            var root            = new Y.DataSource.Local({
                source: data
            });
            root.treeble_config = Y.clone(treeble_config, true);
            root.plug(schema_plugin_config);

            // TreebleDataSource

            var ds = new Y.TreebleDataSource(
            {
                root:             root,
                paginateChildren: false,
                uniqueIdKey:      'the-key-which-uniquely-identifies-each-record'
            });

            // request data

            var callback = {
                success: function(e) {
                },
                error: function() {
                }
            };

            ds.sendRequest(
            {
                request:
                {
                    startIndex: 0,
                    resultCount: 10
                },
                callback: callback
            });*/
        },
        bindUI: function() {
        /* var that = this;
	    this._dataSource.after("response", function(e) {			// Listen for datasource updates
		if (e.response.results && ! e.response.error)  this._table.set('recordset', new Y.Recordset({
		    records:e.response.results
		}));
	    }, this);

	    this._pushButton.on("click", function() {				// New button click event
		Y.Wegas.editor.edit({
		    "@class": "GameModel"
		}, function(cfg) {
		    that._dataSource.rest.post(cfg);
		});
	    }, null, this);

	    Y.delegate('click', function(e) {					// Listen for click events on the table
		var target = e.currentTarget,
		recordSet = this._table.get('recordset'),
		record = recordSet.getRecord(target.ancestor('tr').get('id'));
		//cellIndex = Y.Node.getDOMNode(target).cellIndex,
		//columnSet = this.get('columnset');
		//col = columnSet._conf.data.value.definitions[cellIndex],
		//name= recordSet.getRecord(target.ancestor('tr').get('id')).getValue('name');

		this._dataSource.rest.getById(record.getValue('id'));

		this._dataSource.once('response', function(e) {
		    Y.Wegas.editor.edit(e.response.results[0], function(cfg) {
			that._dataSource.rest.put(cfg);
		    });
		})

	    }, this.get(CONTENTBOX), 'td', this);*/
        },
        syncUI: function() {
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'Treeble'
            },
            type: {
                value: "Treeble"
            },
            columnset: {},
            dataSource: {}
        }
    });

    Y.namespace('Wegas').DataTable = DataTable;
});