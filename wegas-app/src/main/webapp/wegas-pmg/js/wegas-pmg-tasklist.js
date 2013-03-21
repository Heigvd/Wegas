/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-pmg-tasklist", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Tasklist;

    Tasklist = Y.Base.create("wegas-pmg-tasklist", Y.Wegas.PmgDatatable, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        /*** Lifecycle methods ***/
        initializer: function () {
            this.handlers = {};
        },
        renderUI: function () {
            Tasklist.superclass.renderUI.apply(this);
        },
        bindUI: function () {
            Tasklist.superclass.bindUI.apply(this);
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            this.handlers.sort = this.datatable.after('sort', this.syncUI, this);

            this.handlers.displayDescription = this.datatable.delegate('click', function (e) {
                this.displayDescription(e);
            }, '.yui3-datatable-data td', this);

            this.handlers.removeDescription = this.datatable.delegate('mouseout', function (e) {
                this.removeDescription(e);
            }, '.yui3-datatable-data tr', this);
        },
        syncUI: function () {
            Tasklist.superclass.syncUI.apply(this);
            this.checkRealization();
        },
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        },
        //*** Private Methods ***/
        checkRealization: function () {
            var i, cb = this.get(CONTENTBOX), tasks, taskDesc, taskInst, realized, allRow;
            if (this.data == null
                    || this.data.length == 0
                    || this.get("columnValues").indexOf('realized') <= -1) {
                return;
            }
            tasks = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get("variables"));
            allRow = cb.all(".yui3-datatable-data tr");
            allRow.removeClass("notstarted").removeClass("started").removeClass("completed");
            allRow.each(function (node) {
                for (i = 0; i < tasks.get('items').length; i += 1) {
                    taskDesc = tasks.get('items')[i];
                    taskInst = taskDesc.getInstance();
                    realized = (taskInst.get('properties').realized) ? taskInst.get('properties').realized : null;
                    if (realized) {
                        if (node.one("*").getContent() == taskDesc.get('id')) {
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
            var i, id, label, tasks, node, divDesc, taskDesc, description;
            node = e.currentTarget;
            if (this.get("viewDescription") == "false"
                    || node.one(".description")
                    || node.get("className").indexOf("cell-gantt") > -1) {
                return;
            }
            id = node.ancestor().one("*").getContent();
            tasks = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get("variables"));
            if (!id || !tasks) {
                return;
            }
            for (i = 0; i < tasks.get('items').length; i += 1) {
                taskDesc = tasks.get('items')[i];
                if (taskDesc.get('id') == id) {
                    label = (taskDesc.get("label") || taskDesc.get("name"));
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

    Y.namespace("Wegas").PmgTasklist = Tasklist;
});