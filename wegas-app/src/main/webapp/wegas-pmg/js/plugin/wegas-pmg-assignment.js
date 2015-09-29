/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
/*global YUI*/
YUI.add("wegas-pmg-assignment", function(Y) {
    "use strict";

    /**
     *  @class color occupation in datatable
     *  @name Y.Plugin.Assignment
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var CONTENTBOX = "contentBox", HOST = "host",
        Wegas = Y.Wegas, Assignment;

    Assignment = Y.Base.create("wegas-pmg-assignment", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Assignment */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = {};
            this.sortable = [];

            this.get(HOST).datatable.addColumn({
                key: "assignments",
                label: Y.Wegas.I18n.t("pmg.resources.assignments").capitalize(),
                formatter: this.formatAssignment,
                allowHTML: true
            }, this.get("columnPosition"));

            this.onceAfterHostEvent("render", function() {
                this.bind();
                this.sync();
            });
        },
        bind: function() {
            var table = this.get(HOST).datatable;

            this.handlers.update = Wegas.Facade.Variable.after("update", this.sync, this);

            this.handlers.createMenu = table.delegate("click", this.createMenu, // fill the "add" menu on click
                ".yui3-datatable-data .assignment .assign", this);

            this.handlers.remove = table.delegate("click", function(e) {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    var node = e.target.get("parentNode").get("parentNode");
                    Wegas.Facade.Variable.sendQueuedRequest({
                        request: "/ResourceDescriptor/RemoveAssignment/" + node.getAttribute("assignmentid"),
                        cfg: {
                            method: "DELETE",
                            updateEvent: false
                        },
                        on: {
                            success: Y.bind(this.syncHost, this)
                        }
                    });
                    //this.destroySortables();
                    //node.remove(true);
                    //this.sync();
                }, this));
            }, ".task .remove", this);

            this.handlers.moveLeft = table.delegate("click", function(e) {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    var node = e.target.get("parentNode").get("parentNode");
                    node.swap(node.previous());
                    this.savePosition(node);
                }, this));
            }, ".task .dirleft", this);

            this.handlers.moveRight = table.delegate("click", function(e) {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    var node = e.target.get("parentNode").get("parentNode");
                    node.swap(node.next());
                    this.savePosition(node);
                }, this));
            }, ".task .dirright", this);

            this.handlers.sort = table.after("sort", this.sync, this);
            this.beforeHostMethod("syncUI", this.destroySortables);
            this.afterHostMethod("syncUI", this.sync);
        },
        sync: function() {
            this.destroySortables();

            this.get("host").get("contentBox").all(".tasks").each(function(n) {
                var sort = new Y.Sortable({
                    container: n,
                    nodes: ".task",
                    opacity: ".1"
                });
                sort.delegate.after("drag:end", this.onDragEnd, this);
                this.sortable.push(sort);
            }, this);
        },
        syncHost: function() {
            this.hideOverlay();
            Y.later(10, this.get("host"), this.get("host").syncUI);
        },
        formatAssignment: function(o) {
            var i, taskDesc,
                assignments = o.data.descriptor.getInstance().get("assignments"), // get assignments
                node = ["<div class='assignment'><span class='assign'></span></div>", // "Add assignments" menu;
                    "<div class='tasks'>"];
            for (i = 0; i < assignments.length; i += 1) {
                taskDesc = Wegas.Facade.Variable.cache.find("id", assignments[i].get("taskDescriptorId"));
                node.push("<em class='task' assignmentid=", assignments[i].get("id"), ">",
                    "<span class='label'>", taskDesc.get("index"), "</span>",
                    "<div class='menu'><span class='dirleft'></span>",
                    "<span class='remove'></span>",
                    "<span class='dirright'></span></div>",
                    "</em>");
            }
            node.push("</div>");
            return node.join("");
        },
        createMenu: function(e) {
            var resourceDesc = this.get(HOST).datatable.getRecord(e.target).get("descriptor"),
                tasks = this.getTasks(resourceDesc),
                task;

            if (!this.menu) {
                this.menu = new Wegas.Menu();
                this.menuDetails = new Wegas.Menu({
                    width: "250px"
                });
                this.timer = new Wegas.Timer({
                    duration: "500"
                });
                this.timer.on("timeOut", function() {
                    this.menuDetails.show();
                    this.getTaskDescription(task);
                }, this);

                this.menu.on("button:mouseenter", function(e) {                 // align the menu
                    this.menuDetails.hide();
                    this.menuDetails.set("align", {
                        node: this.menu.get("boundingBox"),
                        points: (e.details[0].domEvent.clientX > Y.DOM.winWidth() / 2) ?
                            ["tr", "tl"] : ["tl", "tr"]
                    });
                    task = e.target.get("data").assignement.taskDescriptor;
                    this.timer.reset();
                }, this);

                this.menu.on("visibleChange", function(e) {                     // When the menu is hidden, hide the details panel
                    if (!e.newVal) {
                        this.menuDetails.hide();
                        this.timer.cancel();
                    }
                }, this);

                this.menu.on("button:click", this.onTaskMenuClick, this);
            }
            this.menu.destroyAll();
            if (!tasks || tasks.length <= 0) {
                return;
            }
            this.menu.add(tasks);
            this.menu.attachTo(e.target);
        },
        getTasks: function(resourceDesc) {
            //add is a boolean to determine if target is remove or add a task
            //you can only add a task which isn't already added.
            //you can only remove a task which is added.
            var i, tasks, taskDesc, label, array = [], taskExist,
                assignments = resourceDesc.getInstance().get("assignments");

            if (!this.get("taskList")) {
                return [];
            }
            tasks = Wegas.Facade.Variable.cache.find("name", this.get("taskList")).get("items");
            for (i = 0; i < tasks.length; i += 1) {
                taskDesc = tasks[i];
                taskExist = Y.Array.find(assignments,
                    function(item) {
                        return taskDesc.get("id") === item.get("taskDescriptorId");
                    });
                if (taskDesc.getInstance().get("active") && taskDesc.getInstance().get("properties.completeness") < 100) {
                    label = taskDesc.get("title") || taskDesc.get("label") || taskDesc.get("name") || "undefined";
                    array.push({
                        type: "Button",
                        label: taskDesc.get("index") + ". " + label,
                        data: {
                            assignement: {
                                "@class": "Assignment",
                                taskDescriptor: taskDesc
                            },
                            resourceDesc: resourceDesc
                        },
                        cssClass: (taskDesc.getInstance().get("properties.completeness") > 0 ? "pmg-line-completeness-started " : "")
                            + (taskExist ? "pmg-menu-invalid" : "")
                    });
                }
            }
            return array;
        },
        onTaskMenuClick: function(e) {
            this.menuDetails.hide();
            if (e.target.get("boundingBox").hasClass("pmg-menu-invalid")) {
                return;
            }

            Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                var data = e.target.get("data");

                this.showOverlay();

                Wegas.Facade.Variable.sendQueuedRequest({
                    request: "/ResourceDescriptor/AbstractAssign/" + data.resourceDesc.getInstance().get("id"),
                    cfg: {
                        method: "POST",
                        data: data.assignement,
                        updateEvent: false
                    },
                    on: {
                        success: Y.bind(this.syncHost, this),
                        failure: Y.bind(this.hideOverlay, this)
                    }
                });
            }, this));
        },
        getTaskDescription: function(taskDescriptor) {
            if (taskDescriptor.get("description")) {
                this.descriptionToDisplay(taskDescriptor, taskDescriptor.get("description"));
                return;
            }
            Wegas.Facade.Variable.cache.getWithView(taskDescriptor, "Extended", {// Retrieve the object from the server in Export view
                on: Wegas.superbind({
                    success: function(e) {
                        taskDescriptor.set("description", e.response.entity.get("description"));
                        this.descriptionToDisplay(taskDescriptor, e.response.entity.get("description"));
                    },
                    failure: function() {
                        this.menuDetails.get(CONTENTBOX).setHTML("<div style=\"padding:5px 10px\"><i>Error loading description</i></div>");
                    }
                }, this)
            });
        },
        descriptionToDisplay: function(descriptor, fieldValue) {
            var i, requirements = descriptor.getInstance().get("requirements"),
                progress = descriptor.getInstance().get("properties.completeness") > 0 ? '<div style="float:right;">' + Y.Wegas.I18n.t("pmg.tasks.realized").capitalize().colonize() + " " + descriptor.getInstance().get("properties.completeness") + '%</div>' : "",
                dataToDisplay = '<div class="field" style="padding:5px 10px">' + progress + '<p class="popupTitel">' + Y.Wegas.I18n.t('global.description').capitalize() + '</p><p>' + fieldValue + '</p></div><div style="padding:5px 10px" class="requirements"><p class="popupTitel">' + Y.Wegas.I18n.t("pmg.tasks.requirements").capitalize() + '</p>';

            for (i = 0; i < requirements.length; i += 1) {
                if (+requirements[i].get("quantity") > 0) {
                    dataToDisplay = dataToDisplay + "<p>" + requirements[i].get("quantity") + "x " + Y.Wegas.persistence.Resources.GET_SKILL_LABEL(requirements[i].get("work"))
                        + " " + Wegas.PmgDatatable.TEXTUAL_SKILL_LEVEL[requirements[i].get("level")];
                }
            }
            dataToDisplay = dataToDisplay + "</div>";
            this.menuDetails.get(CONTENTBOX).setHTML(dataToDisplay);
        },
        onDragEnd: function(e) {
            this.savePosition(e.currentTarget.get("currentNode"));
        },
        savePosition: function(node) {
            var i = node.get("parentNode").get("children").indexOf(node);
            Wegas.Facade.Variable.sendQueuedRequest({
                request: "/ResourceDescriptor/MoveAssignment/" + node.getAttribute("assignmentid") + "/" + i,
                cfg: {
                    method: "POST",
                    updateEvent: false
                }
            });
        },
        destructor: function() {
            //Y.log("destructor()", "log", "Wegas.Assignment");
            Y.Object.each(this.handlers, function(h) {
                h.detach();
            });
            this.menu && this.menu.destroy();
            this.timer && this.timer.destroy();
            this.menuDetails && this.menuDetails.destroy();
            this.destroySortables();
        },
        destroySortables: function() {
            Y.Array.each(this.sortable, function(s) {
                s.destroy();
            });
            this.sortable = [];
        }
    }, {
        ATTRS: {
            taskList: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
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
        NS: "assignment"
    });
    Y.Plugin.Assignment = Assignment;
});
