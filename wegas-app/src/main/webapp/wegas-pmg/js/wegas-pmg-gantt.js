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
YUI.add("wegas-pmg-gantt", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Gantt;

    Gantt = Y.Base.create("wegas-pmg-gantt", Y.Wegas.PmgDatatable, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        schedule: null,
        initializer: function () {
            this.handlers = {};
            this.schedule = {};
        },
        renderUI: function () {
            var i, periods;
            Gantt.superclass.renderUI.apply(this);
            periods = this.get("periodsDesc");
            if (!periods)
                return;
            for (i = periods.get("minValue"); i <= periods.get("maxValue"); i++) {
                this.datatable.addColumn({
                    key: 'week' + i,
                    label: '' + i
                });
            }
        },
        bindUI: function () {
            Gantt.superclass.bindUI.apply(this);
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            this.handlers.sort = this.datatable.after('sort', this.syncUI, this);

            this.handlers.displayDescription = this.datatable.delegate('click', function (e) {
                this.displayDescription(e);
            }, '.yui3-datatable-data td', this);

            this.handlers.removeDescription = this.datatable.delegate('mouseout', function (e) {
                this.removeDescription(e);
            }, '.yui3-datatable-data tr', this);

            this.handlers.toggleBooking = this.datatable.delegate('click', function (e) {
                this.toggleBooking(e);
            }, '.yui3-datatable-data .cell-gantt', this);
        },
        syncUI: function () {
            var cb = this.get(CONTENTBOX), currentWeek;
            Gantt.superclass.syncUI.apply(this);
            currentWeek = (this.get("periodsDesc")) ? this.get("periodsDesc").getInstance().get("value") : null;
            this.checkRealization();
            this.displayCurrentWeek(currentWeek);
            this.syncGantt();
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
                for (i = 0; i < tasks.get('items').length; i++) {
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
                    || node.get("className").indexOf("noDescription") > -1
                    || node.get("className").indexOf("cell-gantt") > -1)
                return;
            id = node.ancestor().one("*").getContent();
            tasks = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get("variables"));
            if (!id || !tasks)
                return;
            for (i = 0; i < tasks.get('items').length; i++) {
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
            if (!node)
                return;
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
        syncGantt: function () {
            var i, cb = this.get(CONTENTBOX), week, type, row;
            cb.all('.yui3-datatable-data .yui3-datatable-cell').each(function (node) {
                if (node.get("className").indexOf(".yui3-datatable-col-week") > -1) {
                    node.setHTML();
                }
            });
            for (var key in this.schedule) {
                cb.all('.yui3-datatable-data tr').each(function (node) {
                    if (node.one("*").getContent() == key) {
                        row = node;
                    }
                })
                for (i = 0; i < this.schedule[key].length; i++) {
                    week = this.schedule[key][i].week;
                    type = this.schedule[key][i].type;
                    if (type == "suppressible") {
                        row.one('.yui3-datatable-col-week' + week).append("<span class='scheduled'></span>");
                    }
                }

            }
        },
        toggleBooking: function (e) {
            var node, week, taskName;
            node = e.currentTarget;
            if (node.get("className").indexOf("previous-week") > -1)
                return;
            taskName = node.ancestor().one("*").getContent();
            week = this.getCellWeek(node);
            if (!node.one(".scheduled")) {
                node.append("<span class='scheduled'></span>");
                this.scheduleTask(taskName, week);
            } else {
                node.one(".scheduled").remove();
                this.unScheduleTask(taskName, week);
            }

        },
        scheduleTask: function (taskName, week) {
            var i, exist = false;
            if (!this.schedule[taskName]) {
                this.schedule[taskName] = new Array();
            }
            for (i = 0; i < this.schedule[taskName].length; i++) {
                if (this.schedule[taskName][i].week == week) {
                    exist = true;
                    break;
                }
            }
            if (!exist) {
                this.schedule[taskName].push({
                    week: week,
                    type: "suppressible"
                });
            }
        },
        unScheduleTask: function (taskName, week) {
            var i;
            if (this.schedule[taskName]) {
                for (i = 0; i < this.schedule[taskName].length; i++) {
                    if (this.schedule[taskName][i].week == week) {
                        if (this.schedule[taskName][i].type == "suppressible") {
                            this.schedule[taskName].splice(i, 1);
                        }
                        break;
                    }
                }
            }
        },
        getCellWeek: function (cell) {
            var week;
            if (cell.get("className").indexOf("yui3-datatable-col-week") <= -1)
                return null;
            week = cell.get("className").substring(cell.get("className").indexOf("yui3-datatable-col-week") + 23)
            if (week.indexOf(" ") > -1) {
                week = week.substring(0, week.indexOf(" "));
            }
            return week;
        },
        displayCurrentWeek: function (currentWeek) {
            var week, cb = this.get(CONTENTBOX);
            if (!currentWeek)
                return; //add class "previous-week", "current-week" and "next-week" to the column title in Gantt
            cb.all(".yui3-datatable-columns th, .yui3-datatable-data td").each(function (node) {
                if (node.get('className').indexOf("yui3-datatable-col-week") > -1) {
                    if (node.get("nodeName") == "td" || node.get("nodeName") == "TD") {
                        node.addClass("cell-gantt");
                    }
                    week = this.getCellWeek(node);
                    if (week < currentWeek) {
                        node.addClass('previous-week');
                    } else if (week == currentWeek) {
                        node.addClass('current-week');
                    } else if (week > currentWeek) {
                        node.addClass('next-week');
                    }
                }
            }, this);

        }
    }, {
        ATTRS: {
            viewDescription: {
                value: true,
                validator: function (b) {
                    return b == "false" || b == "true";
                }
            },
            periods: {}, // to change to accept global expresssion or simple variable.
            periodsDesc: {
                getter: function () {
                    return Y.Wegas.Facade.VariableDescriptor.cache.findById(
                            Y.Wegas.Facade.VariableDescriptor.script.scopedEval(this.get("periods")));
                }
            }
        }
    });

    Y.namespace("Wegas").PmgGantt = Gantt;
});