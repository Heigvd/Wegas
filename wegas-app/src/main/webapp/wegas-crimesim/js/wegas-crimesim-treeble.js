/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */

YUI.add('wegas-crimesim-treeble', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Treeble;

    Treeble = Y.Base.create("wegas-crimesim-treeble", Y.Widget, [], {
        // *** Fields *** /
        datatable: null,
        root: null,
        handlers: null,
        data: null,
        dataSource: null,
        descriptionColumn: null,
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.handlers = {};
            this.data = [];
            this.descriptionColumn = this.get('descriptionColumn');
        },
        renderUI: function () {
            var columns = this.get('columns');
            if (this.get('isTreeble')) {
                this.datatable = new Y.Treeble({
                    columns: columns
                });
                this.initTreeble(columns);
            } else {
                this.datatable = new Y.DataTable({
                    columns: columns
                });
            }
            this.datatable.render(this.get(CONTENTBOX));
        },
        bindUI: function () {
            if (this.dataSource) {
                this.handlers.openRow = this.dataSource.on('toggled', this.mergeColumns, this);
            }
        },
        syncUI: function (data) {
            this.data = data || [];
            if (this.get('isTreeble')) {
                Y.bind(this.treebleTwistdown(), this);
            } else {
                this.datatable.addRows(this.data);
            }
        },
        destructor: function () {
            this.datatable.destroy();
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        /*** private functions ***/
        initTreeble: function (columns) {
            var i, treeble_config, schema_plugin_config, schema, resultFields, dataSource;
            this.handlers = [];

            //Create and add datasource to Treeble Datatable
            //Add formatter to the "name column" (for indentation)
            for (i = 0; i < this.datatable.get('columns').length; i += 1) {
                if (this.datatable.get('columns')[i].key === this.descriptionColumn) {
                    this.datatable.get('columns')[i].formatter = Y.Treeble.treeValueFormatter;
                    this.datatable.get('columns')[i].allowHTML = true;
                }
            }

            //Add the column wich will contain the "open node"
            this.datatable.addColumn({
                key: 'treeblenub',
                label: '&nbsp;',
                nodeFormatter: Y.Treeble.buildTwistdownFormatter(Y.bind(this.treebleTwistdown, this))
            }, 0, this);

            //Create the schema of the table's datas
            resultFields = columns.slice(0);
            resultFields.push('_open');
            resultFields.push({
                key: 'kiddies',
                parser: 'treebledatasource'
            });
            schema = {
                resultFields: resultFields
            };

            //Create the schema plugin for the datasource's root
            schema_plugin_config = {
                fn: Y.Plugin.DataSourceArraySchema,
                cfg: {
                    schema: schema
                }
            };

            //Create the config object for the datasource's root
            treeble_config = {
                generateRequest: function () {
                },
                schemaPluginConfig: schema_plugin_config,
                childNodesKey: 'kiddies',
                nodeOpenKey: '_open',
                totalRecordsReturnExpr: '.meta.totalRecords'
            };

            //Create the root object for the datasource
            this.root = new Y.DataSource.Local({
                source: null                                                     //because dynamic change of datas
            });
            this.root.treeble_config = Y.clone(treeble_config, true);
            this.root.plug(schema_plugin_config);

            //Create the datasource of the table
            this.dataSource = new Y.DataSource.Treeble({
                root: this.root,
                paginateChildren: false,
                uniqueIdKey: 'startTime'
            }, this);

            //plug datasource to the Treeble Datatable
            this.datatable.plug(Y.Plugin.DataTableDataSource, {
                datasource: this.dataSource
            }, this);
        },
        getTreebleDatas: function () {
            var i, j, data = this.data.slice(0), reply,
                    description, kiddies;
            if (!data) {
                return null;
            }
            for (i = 0; i < data.length; i += 1) {
                reply = Y.Wegas.VariableDescriptorFacade.rest.findById(data[i].choiceDescriptorId);
                if (reply && reply.get('description')) {
                    description = reply.get('description');
                    kiddies = [{}];
                    kiddies[0][this.descriptionColumn] = description;
                    data[i].kiddies = kiddies;
                }
            }
            return data;
        },
        treebleTwistdown: function () {
            this.root.set('source', this.getTreebleDatas());                    //Get currents datas and set datasource
            this.datatable.datasource.load({//Request max 100 rows per trebble's level
                request: {
                    startIndex: 0,
                    resultCount: 100
                }
            });
        },
        mergeColumns: function () {                                             //add a colspan to description to merge columns of description's row.
            var colName = 'yui3-datatable-col-' + this.descriptionColumn,
                    nbCols = this.get('columns').length,
                    isAfterCol = false;
            this.get(CONTENTBOX).all('tr').each(function (row, i) {
                if (row.get('className').indexOf('treeble-depth-') > -1) {           //is a treeble row
                    if (row.get('className').indexOf('treeble-depth-0') <= -1) {     //and isn't a firste-level treeble row
                        if (row.get('className').indexOf(colName) <= -1) {           //and if the column exist
                            row.one('.' + colName).setAttribute('colspan', nbCols);  //add colspan value
                            row.all('td').each(function (cell, i) {                  //hide overflowed columns
                                if (isAfterCol) {
                                    cell.addClass('hidden');
                                }
                                if (cell.get('className').indexOf(colName) > -1) {
                                    isAfterCol = true;
                                }
                            });
                        }
                    }
                }
            });
        }
    }, {
    CSS_PREFIX: "wegas-crimesim-treeble",
        ATTRS: {
            columns: {
                validator: Y.Lang.isArray
            },
            data: {
                validator: Y.Lang.isArray
            },
            isTreeble: {
                value: false,
                validator: function (b) {
                    return b || b === "true";
                }
            },
            descriptionColumn: {
                value: 'startTime',
                type: 'string'
            }
        }
    });

    //Below : Hack because current verion of TreebleDataSource isn't on YUI (this is the worked version from Guithub).
    Y.TreebleDataSource.prototype.toggle = function (path, request, completion) {
        var searchOpen = function (
                /* array */list,
                /* int */nodeIndex)
        {
            for (var i = 0; i < list.length; i++)
            {
                if (list[i].index == nodeIndex)
                {
                    return list[i];
                }
            }

            return false;
        };

        function toggleSuccess (e, node, completion, path)
        {
            if (node.ds.treeble_config.totalRecordsExpr)
            {
                eval('node.childTotal=e.response' + node.ds.treeble_config.totalRecordsExpr);
            }
            else if (node.ds.treeble_config.totalRecordsReturnExpr)
            {
                node.childTotal = e.response.results.length;
            }

            node.open = true;
            node.children = [];
            complete(completion);

            this.fire('toggled',
                    {
                        path: path,
                        open: node.open
                    });
        }
        ;

        function toggleFailure (e, node, completion, path) {
            node.childTotal = 0;

            node.open = true;
            node.children = [];
            complete(completion);

            this.fire('toggled',
                    {
                        path: path,
                        open: node.open
                    });
        }

        function complete (f) {
            if (Y.Lang.isFunction(f))
            {
                f();
            }
            else if (f && f.fn)
            {
                f.fn.apply(f.scope || window, Y.Lang.isUndefined(f.args) ? [] : f.args);
            }
        }

        var list = this._open;
        for (var i = 0; i < path.length; i++)
        {
            var node = searchOpen.call(this, list, path[i]);
            if (!node)
            {
                return false;
            }
            list = node.children;
        }

        if (node.open === null)
        {
            request.startIndex = 0;
            request.resultCount = 0;
            node.ds.sendRequest(
                    {
                        request: node.ds.treeble_config.generateRequest(request, path),
                        cfg: node.ds.treeble_config.requestCfg,
                        callback:
                                {
                                    success: Y.rbind(toggleSuccess, this, node, completion, path),
                                    failure: Y.rbind(toggleFailure, this, node, completion, path)
                                }
                    });
        }
        else
        {
            node.open = !node.open;
            complete(completion);

            this.fire('toggled',
                    {
                        path: path,
                        open: node.open
                    });
        }
        return true;
    };

    Y.namespace('Wegas').CrimeSimTreeble = Treeble;
});