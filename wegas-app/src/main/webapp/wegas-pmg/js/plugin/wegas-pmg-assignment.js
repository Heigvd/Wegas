/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-pmg-assignment', function(Y) {
    "use strict";

    /**
     *  @class color occupation in datatable
     *  @name Y.Plugin.Assignment
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var CONTENTBOX = "contentBox", HOST = "host",
            Wegas = Y.Wegas,
            Assignment = Y.Base.create("wegas-pmg-assignment", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        handlers: null,
        menu: null,
        menuDetails: null,
        sortable: null,
        /** @lends Y.Plugin.Assignment */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = {};
            this.sortable = [];

            this.addAssignmentColumn();
            
            this.onceAfterHostEvent("render", function() {
                this.sync();
                this.bind();
            });
        },
        bind: function() {
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.sync, this);

            this.handlers.createMenu = this.get(HOST).datatable.delegate('click', function(e) {            // fill the "add" menu on click
                this.createMenu(e, true);
            }, '.yui3-datatable-data .assignment .assign', this);
            this.handlers.showDelete = this.get(HOST).datatable.delegate('hover', function(e) {
                if (e.target.getDOMNode().childNodes[0]) {
                    e.target.getDOMNode().childNodes[0].className = "remove show";
                }
            }, function(e) {
                if (e.target.getDOMNode().childNodes[0]) {
                    e.target.getDOMNode().childNodes[0].className = "remove hide";
                }
            }, '.tasks .task', this);

            this.handlers.remove = this.get(HOST).datatable.delegate('click', function(e) {
                var node = e.target.getDOMNode().parentElement;
                Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/ResourceDescriptor/RemoveAssignment/" + node.getAttribute("assignmentid"),
                    cfg: {
                        method: "DELETE"
                    }
                });
            }, '.task .remove', this);

            this.get("host").datatable.after("sort", this.sync, this);
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        sync: function() {
            Y.log("sync()", "log", "Wegas.Assignment");
            this.addButtonsAssignment();
            this.syncSortable();
        },
        addAssignmentColumn: function() {
            this.get(HOST).datatable.addColumn({
                key: 'assignments',
                label: "Assignments"
            }, this.get("columnPosition"));
        },
        addButtonsAssignment: function() {
            var cb = this.get(HOST).get(CONTENTBOX);
            cb.all(".yui3-datatable-data tr .yui3-datatable-col-assignments").each(function(node) {
                node.append("<div class='assignment'></div>");
                node.one('.assignment').append("<span class='assign'></span>");
//                node.addClass('noDescription');
            });
        },
        createMenu: function(e) {
            var i, tasks, resources, resourceDesc, resourceId;
            resourceId = this.get(HOST).datatable.getRecord(e.target).get("id");
            resources = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get(HOST).get('variable'));
            for (i = 0; i < resources.get('items').length; i += 1) {
                if (resources.get('items')[i].get('id') === resourceId) {
                    resourceDesc = resources.get('items')[i];
                    break;
                }
            }
            if (this.menu === null) {
                this.menu = new Y.Wegas.Menu();
                this.menuDetails = new Y.Wegas.Menu({
                    width: "250px"
                });

                this.handlers.moveMenu = this.menu.on("button:mouseenter", function(e) {           // align the menu
                    var timer;
                    this.menuDetails.hide();
                    this.menuDetails.set("align", {
                        node: this.menu.get("boundingBox"),
                        points: (e.details[0].domEvent.clientX > Y.DOM.winWidth() / 2) ?
                                ["tr", "tl"] : ["tl", "tr"]
                    });
                    timer = new Y.Wegas.Timer({
                        duration: "500"
                    });
                    timer.on("timeOut", function() {
                        this.menuDetails.show();
                        this.getTaskDescription(e.target.get("data").assignement.taskDescriptor);
                    }, this);
                    timer.start();
                }, this);

                this.handlers.hideMenu = this.menu.on("visibleChange", function(e) {                 // When the menu is hidden, hide the details panel
                    if (!e.newVal) {
                        this.menuDetails.hide();
                    }
                }, this);

                this.handlers.assignTask = this.menu.on("button:click", this.onTaskMenuClick, this);
            }
            this.menu.removeAll();
            tasks = this.getTasks(resourceDesc);
            if (!tasks || tasks.lenght <= 0) {
                return;
            }
            this.menu.add(tasks);
            this.menu.attachTo(e.target);
        },
        getTasks: function(resourceDesc) {
            //add is a boolean to determine if target is remove or add a task
            //you can only add a task which isn't already added.
            //you can only remove a task which is added.
            var i, tasks, items, taskDesc, label, array = [], no, taskExist,
                    assignments = resourceDesc.getInstance().get("assignments"),
                    taskExistence = function(item) {
                return taskDesc.get("id") === item.get("taskDescriptorId");
            };
            if (!this.get("taskList")) {
                return;
            }
            tasks = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get("taskList"));
            items = tasks.get('items');
            for (i = 0; i < items.length; i += 1) {
                taskExist = false;
                taskDesc = items[i];
                taskExist = Y.Array.find(assignments, taskExistence);
                if (!taskExist && taskDesc.getInstance().get("active")) {
                    no = taskDesc.get("index");
                    label = (taskDesc.get("title") || taskDesc.get("name") || "undefined");
                    array.push({
                        type: "Button",
                        label: no + ". " + label,
                        data: {
                            assignement: {
                                "@class": "Assignment",
                                taskDescriptor: taskDesc
                            },
                            resourceDesc: resourceDesc
                        }
                    });
                }
            }
            return array;
        },
        onTaskMenuClick: function(e) {
            var data = e.target.get("data");
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ResourceDescriptor/AbstractAssign/" + data.resourceDesc.getInstance().get("id"),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(data.assignement)
                }
            });
        },
        getTaskDescription: function(taskDescriptor) {
            if (taskDescriptor.get("description")) {
                this.descriptionToDisplay(taskDescriptor, taskDescriptor.get("description"));
                return;
            }
            Y.Wegas.Facade.VariableDescriptor.cache.getWithView(taskDescriptor, "Extended", {// Retrieve the object from the server in Export view
                on: Y.Wegas.superbind({
                    success: function(e) {
                        taskDescriptor.set("description", e.response.entity.get("description"));
                        this.descriptionToDisplay(taskDescriptor, e.response.entity.get("description"));
                    },
                    failure: function(e) {
                        this.menuDetails.get(CONTENTBOX).setHTML('<div style="padding:5px 10px"><i>Error loading description</i></div>');
                    }
                }, this)
            });
        },
        descriptionToDisplay: function(descriptor, fieldValue) {
            var dataToDisplay, i, requirements;
            dataToDisplay = '<div class="field" style="padding:5px 10px"><p class="popupTitel">Description</p><p>' + fieldValue + '</p></div><div style="padding:5px 10px" class="requirements"><p class="popupTitel">Requirements</p>';
            requirements = descriptor.getInstance().get("requirements");
            for (i = 0; i < requirements.length; i += 1) {
                dataToDisplay = dataToDisplay + "<p>" + requirements[i].get("quantity") + "x " + requirements[i].get("work")
                        + " " + requirements[i].get("level");
            }
            dataToDisplay = dataToDisplay + "</div>";
            this.menuDetails.get(CONTENTBOX).setHTML(dataToDisplay);
        },
        syncSortable: function() {
            var i, node, dt = this.get(HOST).datatable, assignments,
                    resourceDesc, resourceInstance, iResource, iAssign, taskDesc, assignementCell;

            //the drag and drop feature to reorganise tasks.
            for (i = 0; i < this.sortable.length; i += 1) {
                this.sortable[i].destroy();
            }

            // get assignments
            for (iResource = 0; iResource < dt.data._items.length; iResource += 1) {
                resourceDesc = Y.Wegas.Facade.VariableDescriptor.cache.find("id", dt.data._items[iResource].get("id"));
                resourceInstance = resourceDesc.getInstance();
                assignments = resourceInstance.get("assignments");
                node = "<div class='tasks'>";
                for (iAssign = 0; iAssign < assignments.length; iAssign += 1) {
                    taskDesc = Y.Wegas.Facade.VariableDescriptor.cache.find("id", assignments[iAssign].get("taskDescriptorId"));
                    node = node + "<em class='task' assignmentid=" + assignments[iAssign].get("id") + "><span class='remove hide'></span><span>" + taskDesc.get("index") + "</span></em>";
                }
                node = node + "</div>";
                assignementCell = dt.getCell([iResource, this.get("columnPosition")]);
                assignementCell.append(node);
                this.sortable.push(new Y.Sortable({
                    container: assignementCell.one(".tasks"),
                    nodes: '.task',
                    opacity: '.1'
                }));
            }

            for (i = 0; i < this.sortable.length; i += 1) {
                this.sortable[i].delegate.after('drag:end', this.setPosition, this);
            }
        },
        setPosition: function(e) {
            var node = e.currentTarget.get("currentNode").getDOMNode(), i;
            for (i = 0; i < node.parentElement.childNodes.length; i += 1) {
                if (node.parentElement.childNodes[i] === node) {
                    break;
                }
            }
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ResourceDescriptor/MoveAssignment/" + node.getAttribute("assignmentid") + "/" + (i + 1),
                cfg: {
                    method: "POST"
                }
            });
        },
        destructor: function() {
            Y.log("destructor()", "log", "Wegas.Assignment");
            var k, i;
            for (k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k].detach();
                }
            }
            if (this.menu) {
                this.menu.destroy();
            }
            if (this.menuDetails) {
                this.menuDetails.destroy();
            }

            for (i = 0; i < this.sortable.length; i += 1) {
                this.sortable[i].destroy();
            }
        }
    }, {
        ATTRS: {
            taskList: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Task list"
                }
            },
            columnPosition: {
                value: 5,
                _inputex: {
                    _type: "integer",
                    label: "Column position"
                }
            }
        },
        NS: "assignment",
        NAME: "Assignment"
    });
    Y.namespace("Plugin").Assignment = Assignment;
});
