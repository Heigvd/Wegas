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
YUI.add("wegas-pmg-treebletasklist", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Tasklist;

    Tasklist = Y.Base.create("wegas-pmg-treebletasklist", Y.Wegas.PmgDatatable, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        root: null,
        //*** Private Methods ***/
        checkRealization: function () {
            var i, cb = this.get(CONTENTBOX), tasks, taskDesc, taskInst, realized, allRow;
            if (this.data == null
                    || this.data.length == 0
                    || this.get("columnValues").indexOf('realized') <= -1) {
                return;
            }
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
            allRow = cb.all(".yui3-datatable-data tr");
            allRow.removeClass("notstarted").removeClass("started").removeClass("completed");
            allRow.each(function (node) {
                for (i = 0; i < tasks.get('items').length; i += 1) {
                    taskDesc = tasks.get('items')[i];
                    taskInst = taskDesc.getInstance();
                    realized = (taskInst.get('properties').realized) ? taskInst.get('properties').realized : null;
                    if (realized) {
                        if (node.one("*").getContent() == taskDesc.get('name')) {
                            if (realized >= 100) {
                                node.addClass("completed");
                            } else if (realized > 0) {
                                node.addClass("started");
                            } else {
                                node.addClass("notstarted");
                            }
                            break;
                        }
                    }
                }
            });
        },

        displayDescription: function (e) {
            var i, name, label, tasks, node, divDesc, taskDesc, description;
            node = e.currentTarget;
            if (this.get("viewDescription") == "false"
                    || node.one(".description")
                    || node.get("className").indexOf("cell-gantt") > -1) {
                return;
            }
            name = node.ancestor().one("*").getContent();
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
            if (!name || !tasks) {
                return;
            }
            for (i = 0; i < tasks.get('items').length; i += 1) {
                taskDesc = tasks.get('items')[i];
                if (taskDesc.get('name') === name) {
                    label = (taskDesc.get("label") || name);
                    description = taskDesc.get("description");
                    break;
                }
            }
            divDesc = Y.Node.create("<div class='description'></div>");
            divDesc.append("<p class='task_name'>" + label + "</p>").append("<p class='content'>" + description + "</p>");
            node.append(divDesc);
        },

        removeDescription: function (e) {
            var disappearAnim, node;
            node = this.get(CONTENTBOX).one('.description');
            if (!node) {
                return;
            }
            disappearAnim = new Y.Anim({
                node: node,
                to: {
                    opacity: 0
                },
                duration: 0.2
            });
            disappearAnim.run();
            disappearAnim.on('end', function () {
                node.remove();
            });
        },

        getTreebleDatas: function () {
            var i, data = this.data.slice(0), tasks, description;
            if (!data) {
                return null;
            }
            //get data of the Treeble Datatable and add "kiddies" with description of the task
            tasks = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.get("variables"));
            for (i = 0; i < data.length; i += 1) {
                description = tasks.get('items')[i].get('description');
                data[i].kiddies = [{
                    Name: description
                }];
            }
            return data;
        },

        treebleTwistdown: function () {
            this.root.set('source', this.getTreebleDatas());                    //Get currents datas and set datasource
            this.datatable.datasource.load({//Request max 10 rows per trebble's level
                request: {
                    startIndex: 0,
                    resultCount: 10
                }
            });
            this.checkRealization();
        },

        initializer: function () {
            var i, treeble_config, schema_plugin_config, schema, resultFields, dataSource;
            this.handlers = [];

            //Create and add datasource to Treeble Datatable
            //Add formatter to the "name column" (for indentation)
            for (i = 0; i < this.datatable.get('columns').length; i += 1) {
                if (this.datatable.get('columns')[i].key === 'Name') {
                    this.datatable.get('columns')[i].formatter = Y.Treeble.treeValueFormatter;
                    this.datatable.get('columns')[i].allowHTML = true;
                }
            }

            //Add the column wich will contain the "open node"
            this.datatable.addColumn({
                key: 'treeblenub',
                label: '&nbsp;',
                nodeFormatter: Y.Treeble.buildTwistdownFormatter(Y.bind(this.treebleTwistdown, this))
            }, 1, this);

            //Create the schema of the table's datas
            resultFields = this.get('columnTitles').slice(0);
            resultFields.unshift('_name');
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
                source: null
            });
            this.root.treeble_config = Y.clone(treeble_config, true);
            this.root.plug(schema_plugin_config);

            //Create the datasource of the table
            dataSource = new Y.DataSource.Treeble({
                root: this.root,
                paginateChildren: false,
                uniqueIdKey: '_name'
            }, this);

            //plug datasource to the Treeble Datatable
            this.datatable.plug(Y.Plugin.DataTableDataSource, {
                datasource: dataSource
            }, this);
        },

        renderUI: function () {
            Tasklist.superclass.renderUI.apply(this);
        },

        bindUI: function () {
            Tasklist.superclass.bindUI.apply(this);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(this.datatable.after('sort', this.syncUI, this));
            this.handlers.push(this.datatable.delegate('click', function (e) {
                this.displayDescription(e);
            }, '.yui3-datatable-data td', this));
            this.handlers.push(this.datatable.delegate('mouseout', function (e) {
                this.removeDescription(e);
            }, '.yui3-datatable-data tr', this));
        },

        syncUI: function () {
            Tasklist.superclass.syncUI.apply(this);
            Y.bind(this.treebleTwistdown(), this);
            this.checkRealization();
        },

        destructor: function () {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }

    }, {
        ATTRS: {
            viewDescription: {
                value: true,
                validator: function (b) {
                    return b == "false" || b == "true";
                }
            },
            viewAssignements: {//todo
                value: true,
                validator: function (b) {
                    return b == "false" || b == "true";
                }
            }
        }
    });

    Y.namespace("Wegas").PmgTreebleTasklist = Tasklist;
});