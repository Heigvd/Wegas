/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
/*global YUI, Chart*/
YUI.add("wegas-pmg-slidepanel", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox",
        SlidePanel, Wegas = Y.Wegas;

    SlidePanel = Y.Base.create("wegas-pmg-slidepanel",
        Y.Widget,
        [Y.WidgetParent,
            Y.WidgetChild,
            Wegas.Editable,
            Wegas.Parent],
        {
            BOUNDING_TEMPLATE: "<div><div class='slidepanel-title' style='position:relative;'><h2></h2></div></div>",
            renderUI: function() {
                var title = this.get("title"), pattern = /%([a-zA-Z0-9_]*)%/g,
                    args = title.match(pattern), i, str;


                if (args) {
                    for (i = 0; i < args.length; i += 1) {
                        str = Y.Wegas.Facade.Variable.cache.find("name", args[i].replace(/%/g, "")).get("label");
                        title = title.replace(args[i], str);
                    }
                }
                this.handlers = {};
                this.get("boundingBox").one(".slidepanel-title h2").setContent(title);
                if (this.get("openByDefault")) {
                    this.get("boundingBox").addClass("wegas-slidepanel-toggled");
                }
            },
            bindUI: function() {
                this.handlers.update = Wegas.Facade.Variable.after("update", this.syncUI, this);
                if (this.get("animation")) {
                    this.get("boundingBox").one(".slidepanel-title").on('click', function(e) {
                        e.preventDefault();
                        this.get("boundingBox").toggleClass("wegas-slidepanel-toggled");
                    }, this);
                }
            },
            destructor: function() {
                var k;
                for (k in this.handlers) {
                    this.handlers[k].detach();
                }
            }
        }, {
        ATTRS: {
            title: {
                type: "string",
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                },
                _inputex: {
                    label: "Title"
                }
            },
            animation: {
                type: "boolean",
                value: true,
                _inputex: {
                    label: "Animation"
                }
            },
            openByDefault: {
                type: "boolean",
                value: true,
                _inputex: {
                    label: "Open by default"
                }
            }
        }
    });
    Wegas.PmgSlidePanel = SlidePanel;

    /**
     * Shortcut to create a slidepanel for each resource folders available.
     */
    Wegas.PmgResourcesPanels = Y.Base.create("wegas-pmg-resourcespanels",
        Y.Widget,
        [Y.WidgetParent,
            Y.WidgetChild,
            Wegas.Editable,
            Wegas.Parent],
        {
            renderUI: function() {
                var resourceFolder = Wegas.Facade.Variable.cache.find("name", "employees"),
                    autoDesc = Wegas.Facade.Variable.cache.find("name", "autoReservation"),
                    autoReserve = autoDesc && autoDesc.getInstance().get("value"); // Ensure variable exists
                //currentPhase = Wegas.Facade.Variable.cache.find("name", "currentPhase").getValue();

                this.panels = Y.Array.map(resourceFolder.get("items"), function(vd) {
                    var panel = new Wegas.PmgSlidePanel({
                        title: vd.get("label"),
                        children: [{
                                type: "PmgDatatable",
                                plugins: [{
                                        fn: "ScheduleDT",
                                        cfg: {
                                            variable: {
                                                name: "periodPhase3"
                                            }
                                        }
                                    }, {
                                        fn: "Assignment",
                                        cfg: {
                                            taskList: {
                                                name: "tasks"
                                            },
                                            columnPosition: 5
                                        }
                                    }, {
                                        fn: "OccupationColor",
                                        cfg: {
                                            autoReservation: autoReserve
                                        }
                                    }, {
                                        fn: "ActivityColor"
                                    }
                                ],
                                variable: {
                                    name: vd.get("name")
                                },
                                columnsCfg: [{
                                        key: "label",
                                        label: "Name",
                                        sortable: false
                                    }, {
                                        label: "Grade",
                                        formatter: "skillLevel",
                                        key: "instance.properties.level",
                                        sortable: false,
                                        allowHTML: true
                                    }, {
                                        label: "Monthly wages",
                                        key: "instance.properties.wage",
                                        sortable: false
                                    }, {
                                        label: "Rate",
                                        key: "instance.properties.activityRate",
                                        sortable: false
                                    }, {
                                        label: "Motiv.",
                                        key: "instance.properties.motivation",
                                        sortable: false
                                    }],
                                defaultSort: null
                            }, {
                                type: "Text",
                                content: "<div class=\"pmg-legend\">\n<div><div class=\"worked\">&nbsp;</div>\nWorked</div>\n<div><div class=\"booked\">&nbsp;</div>\nAssigned</div>\n<div>\n<div class=\"unavailable\">&nbsp;</div>\nNot Available</div>\n<div>\n<div class=\"engagementDelay\">&nbsp;</div>\nToo late to change</div>\n</div>"
                            }]
                    }).render(this.get(CONTENTBOX));
                    if (!autoReserve) {
                        var dt = panel.item(0);
                        //panel.item(0).plug(Y.Plugin.AutoReservationColor, {
                        //    taskList: {
                        //        name: "tasks"
                        //    }
                        //});
                        //} else {
                        dt.plug(Y.Plugin.Reservation); // Player can click cell to reserve
                        dt.plug(Y.Plugin.EngagmentDelay);
                        dt.after("filtered", function() {
                            if (panel.get(CONTENTBOX).all(".resourcepanel-warn").size()) {
                                panel.get("boundingBox").addClass("resourcepanel-warn");
                            } else {
                                panel.get("boundingBox").removeClass("resourcepanel-warn");
                            }
                        });
                        dt.plug(Y.Plugin.PMGLineFilter, {
                            filterFn: function(data, node) {
                                var instance = data.get("instance"),
                                    assignments = instance.assignments && instance.assignments.length > 0,
                                    currentPeriod = Y.Wegas.Facade.Variable.cache.find("name",
                                        "periodPhase3").getValue(),
                                    occupations = Y.Array.some(instance.occupations, function(i) {
                                        return i.get("editable") && currentPeriod < i.get("time") + 1;
                                    });
                                node.toggleClass("resourcepanel-warn", occupations !== assignments);
                            }
                        });

                    }
                    panel.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this);
                    return panel;
                }, this);
            },
            destructor: function() {
                Y.Array.each(this.panels, function(p) {
                    p.destroy();
                });
            }
        });


    /**
     * Shortcut to create a slidepanel for each iteration.
     */
    Wegas.PmgIterationWidget = Y.Base.create("wegas-pmg-iteration-widget", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"iteration-config\">" +
            "<div class=\"iteration-tasks\">" +
            "<div class=\"iteration-tasks-title\">Tasks:</div>" +
            "<div class=\"iteration-tasks-list\"></div>" +
            "<div class=\"iteration-tasks-toolbar\"></div>" +
            "</div>" +
            "<div class=\"begin-at-container\">" +
            "<span class=\"begin-at-label\"></span>" +
            "<div class=\"begin-at-input-container\">" +
            "<input class=\"begin-at-input\" />" +
            "</div>" +
            "</div>" +
            "<div class=\"minp\"></div>" +
            "<div class=\"maxp\"></div>" +
            "</div>" +
            "<div class=\"iteration-chart\">" +
            "<canvas class='chart' width='400' height='200'></canvas>" +
            "<div class=\"iteration-planning\">" +
            "<div class=\"planning-initial\"></div>" +
            "<div class=\"planning-ongoing\"></div>" +
            "</div>" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
        },
        getMinKey: function(obj) {
            return Math.min.apply(null, Y.Object.keys(obj).map(function(e) {
                return +e;
            }));
        },
        getMaxKey: function(obj) {
            var p = Math.max.apply(null, Y.Object.keys(obj).map(function(e) {
                return +e;
            }));
            return (p < 0 ? 0 : p);
        },
        getBurndown: function() {
            return Y.Wegas.Facade.Variable.cache.find("name", "burndown").getInstance();
        },
        getIteration: function() {
            var i,
                iterations = this.getBurndown().get("iterations"),
                targetId = this.get("iterationId");
            for (i in iterations) {
                if (iterations[i].get("id") === targetId) {
                    return iterations[i];
                }
            }
            return null;
        },
        syncUI: function() {
            var CB = this.get(CONTENTBOX),
                iteration = this.getIteration(),
                totalWorkload,
                remainingWorkload = 0,
                minPeriod, maxPeriod,
                status = iteration.getStatus(),
                currentPhase = Y.Wegas.PMGHelper.getCurrentPhaseNumber(),
                currentPeriod = Y.Wegas.PMGHelper.getCurrentPeriodNumber(),
                period,
                planning = iteration.get("plannedWorkloads"),
                replanning = iteration.get("replannedWorkloads"),
                workloads = iteration.get("workloads"),
                planningSerie = [],
                effectiveSerie = [],
                tasks = iteration.getTaskDescriptors(),
                taskD, i, node, wl,
                input,
                data = {
                    labels: [],
                    datasets: []
                };

            node = CB.one(".iteration-tasks-list");
            node.setContent("");
            for (i = 0; i < tasks.length; i += 1) {
                taskD = tasks[i];
                node.append("<em class='task' taskId=" + taskD.get("id") + ">" +
                    "<span class='label'>" + taskD.get("index") + "</span>" +
                    (status === "NOT_STARTED" ? "<div class='menu'><span class='remove'></span></div>" : "") +
                    "</em>");
            }

            // edit beginAt only available when iteration has not started yet
            if (status === "NOT_STARTED") {
                CB.one(".begin-at-label").setContent("Begin at period: ");
                CB.one(".begin-at-input").set("value", iteration.get("beginAt"));
                CB.one(".iteration-tasks-toolbar").setContent("<span class=\"add\"></span>");
            } else {
                CB.one(".begin-at-label").setContent("Began at period: ");
                this.get(CONTENTBOX).one(".begin-at-input-container").setContent('<p>' +
                    iteration.get("beginAt") + '</p>');
            }
            CB.one(".iteration-tasks-toolbar").set("content", "<div class=\"tasks\"></div>");

            minPeriod = Math.min(Math.min.apply(null, iteration.get("workloads").map(function(e) {
                return e.get("val.periodNumber");
            })),
                this.getMinKey(iteration.get("replannedWorkloads")),
                iteration.get("beginAt"));

            maxPeriod = Math.max(Math.max.apply(null, iteration.get("workloads").map(function(e) {
                return e.get("val.periodNumber");
            })),
                this.getMaxKey(iteration.get("replannedWorkloads")),
                iteration.get("beginAt") + this.getMaxKey(iteration.get("plannedWorkloads"))) + 1;

            CB.one(".iteration-config .minp").setContent("minp: " + minPeriod);
            CB.one(".iteration-config .maxp").setContent("maxp: " + maxPeriod);

            totalWorkload = iteration.getTotalWorkload();

            if (status === "STARTED") {
                // On Going or completed iteration
                remainingWorkload = iteration.get("workloads")[currentPeriod];
            } else if (status === "NOT_STARTED") {
                remainingWorkload = totalWorkload;
            }

            planningSerie.push(totalWorkload);
            node = CB.one(".planning-initial");
            node.setContent("");

            for (period = minPeriod; period <= maxPeriod; period += 1) {
                data.labels.push(period);
                if (period >= iteration.get("beginAt")) {
                    wl = planning[period - iteration.get("beginAt")] || 0;

                    wl.toFixed(2);


                    if (status === "NOT_STARTED" && totalWorkload > 0) {
                        input = node.append("<input class=\"planning planning-p" + period + "\" period=\"" + period + "\" value=\"" + wl + " \"/>");
                        //this.handlers.push(input.on("change", this.plan, this));
                    } else {
                        if (period < maxPeriod) {
                            node.append("<span class=\"planning\">" + wl + "</span>");
                        }
                    }
                    totalWorkload -= wl;
                } else {
                    node.append("<span class=\"planning\">0</span>");
                }

                planningSerie.push(totalWorkload);
            }
            if (totalWorkload > 0) {
                maxPeriod += 1;
                planningSerie.push(totalWorkload);
                data.labels.push(maxPeriod);
            }

            node = CB.one(".planning-ongoing");
            node.setContent("");
            if (status !== "NOT_STARTED") {
                var m = {};
                for (i = 0; i < workloads.length; i += 1) {
                    m[workloads[i].get("val.periodNumber")] = workloads[i].get("val.workload");
                }
                for (i in m) {
                    remainingWorkload = m[i].toFixed(2);
                    node.append("<span class=\"workload\">" + remainingWorkload + "</span>");
                    effectiveSerie.push(remainingWorkload);
                }

                for (period in replanning) {
                    remainingWorkload -= replanning[period].toFixed(2);
                    effectiveSerie.push((remainingWorkload < 0 ? 0 : remainingWorkload));
                    if (remainingWorkload > 0) {
                        input = node.append("<input class=\"replanning\" period=\"" + period + "\" value=\"" + replanning[period].toFixed(2) + " \"/>");
                        //this.handlers.push(input.on("change", this.plan, this));
                    }
                }
                if (remainingWorkload > 0) {
                    period = +period + 1;
                    input = node.append("<input class=\"replanning\" period=\"" + period + "\" value=\"0\"/>");
                    maxPeriod += 1;
                    data.labels.push(maxPeriod);
                    effectiveSerie.push((remainingWorkload < 0 ? 0 : remainingWorkload));
                }

            }

            if (planningSerie.length > 0) {
                data.datasets.push({
                    label: "Planning",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: planningSerie
                });
            }

            if (effectiveSerie.length > 0) {
                data.datasets.push({
                    label: "Effective",
                    fillColor: "rgba(151,187,205,0.2)",
                    strokeColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: effectiveSerie
                });
            }

            this.canvas = CB.one(".iteration-chart canvas.chart").set("width", (maxPeriod - minPeriod + 1) * 50);

            this.ctx = this.canvas.getDOMNode().getContext("2d");
            //ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.chart = new Chart(this.ctx).Line(data, {
                //                         responsive: true,
                bezierCurve: false,
                scaleBeginAtZero: true
            });

        },
        bindUI: function() {
            var input, CB = this.get(CONTENTBOX);

            this.handlers.push(CB.delegate("valuechange", this.plan, "input.planning", this));
            this.handlers.push(CB.delegate("valuechange", this.plan, "input.replanning", this));
            this.handlers.push(CB.delegate("click", this.createMenu, ".iteration-tasks-toolbar .add", this));
            //this.handlers.push(CB.delegate("click", this.createMenu, ".iteration-tasks-toolbar .add", this));
            this.handlers.push(CB.delegate("click", this.removeTask, ".task .remove", this));

            input = CB.one(".begin-at-input");
            if (input) {
                this.handlers.push(input.on("change", this.updateBeginAt, this));
            }
        },
        removeTask: function(e) {
            var node = e.target.get("parentNode").get("parentNode");
            this.execScript("PMGHelper.removeTaskFromIteration(" + node.getAttribute("taskid") + ", " + this.get("iterationId") + ");");
        },
        plan: function(e) {
            var input = e.target,
                data = input.getData(),
                value = +input.get("value");

            if (data.wait) {
                data.wait.cancel();
            }
            data.wait = Y.later(200, this, function() {
                data.wait = null;
                this.execScript("PMGHelper.planIteration(" + this.get("iterationId") + ", " + input.getAttribute("period") + "," + value + ");");
            }, this);
        },
        updateBeginAt: function(e) {
            var input = this.get(CONTENTBOX).one(".begin-at-input"),
                data = input.getData(),
                value = +input.get("value");

            if (data.wait) {
                data.wait.cancel();
            }
            data.wait = Y.later(200, this, function() {
                data.wait = null;
                this.execScript("PMGHelper.setIterationBeginAt(" + this.get("iterationId") + ", " + value + ");");
            }, this);
        },
        updateName: function(e) {
            var input = this.get(CONTENTBOX).one(".name-input"),
                data = input.getData(),
                value = +input.get("value");

            if (data.wait) {
                data.wait.cancel();
            }
            data.wait = Y.later(200, this, function() {
                data.wait = null;
                this.execScript("PMGHelper.setIterationName(" + this.get("iterationId") + ", " + value + ");");
            }, this);
        },
        getTasks: function() {
            var i, tasks, taskDesc, label, array = [], taskExist;

            tasks = Wegas.Facade.Variable.cache.find("name", "tasks").get("items");
            for (i = 0; i < tasks.length; i += 1) {
                taskDesc = tasks[i];
                taskExist = Y.Array.find(this.getBurndown().get("iterations"), function(iteration) {
                    return Y.Array.find(iteration.getTaskDescriptors(), function(item) {
                        return taskDesc.get("id") === item.get("id");
                    });
                });
                if (taskDesc.getInstance().get("active") && taskDesc.getInstance().get("properties.completeness") < 100) {
                    label = taskDesc.get("title") || taskDesc.get("label") || taskDesc.get("name") || "undefined";
                    array.push({
                        type: "Button",
                        label: taskDesc.get("index") + ". " + label,
                        data: {
                            taskDescriptor: taskDesc
                        },
                        cssClass: (taskDesc.getInstance().get("properties.completeness") > 0 ? "pmg-line-completeness-started " : "")
                            + (taskExist ? "pmg-menu-invalid" : "")
                    });
                }
            }
            return array;
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
                progress = descriptor.getInstance().get("properties.completeness") > 0 ? '<div style="float:right;">Realised:' + descriptor.getInstance().get("properties.completeness") + '%</div>' : "",
                dataToDisplay = '<div class="field" style="padding:5px 10px">' + progress + '<p class="popupTitel">Description</p><p>' + fieldValue + '</p></div><div style="padding:5px 10px" class="requirements"><p class="popupTitel">Requirements</p>';

            for (i = 0; i < requirements.length; i += 1) {
                if (+requirements[i].get("quantity") > 0) {
                    dataToDisplay = dataToDisplay + "<p>" + requirements[i].get("quantity") + "x " + Y.Wegas.persistence.Resources.GET_SKILL_LABEL(requirements[i].get("work"))
                        + " " + Wegas.PmgDatatable.TEXTUAL_SKILL_LEVEL[requirements[i].get("level")];
                }
            }
            dataToDisplay = dataToDisplay + "</div>";
            this.menuDetails.get(CONTENTBOX).setHTML(dataToDisplay);
        },
        createMenu: function(e) {
            var tasks = this.getTasks(),
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
                    task = e.target.get("data").taskDescriptor;
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
        execScript: function(script) {
            Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                this.showOverlay();
                Wegas.Facade.Variable.sendRequest({
                    request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST",
                        //updateCache: false,
                        //updateEvent: false,
                        data: {
                            "@class": "Script",
                            content: script
                        }
                    },
                    on: {
                        success: Y.bind(function() {
                            this.hideOverlay();
                            this.syncUI();
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
                            this.syncUI();
                        }, this)
                    }
                });

            }, this));
        },
        onTaskMenuClick: function(e) {
            this.menuDetails.hide();
            if (e.target.get("boundingBox").hasClass("pmg-menu-invalid")) {
                return;
            }
            this.execScript("PMGHelper.addTaskToIteration(" + e.target.get("data").taskDescriptor.get("id") + ", " + this.get("iterationId") + ");");
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        }
    }, {
        ATTRS: {
            iterationId: {
                type: "number"
            },
            burndownInstanceId: {
                type: "number"
            }
        }
    });


    /**
     * Shortcut to create a slidepanel for each iteration.
     */
    Wegas.PmgIterationsPanels = Y.Base.create("wegas-pmg-iterations-panels", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"iterations\"></div>" +
            "<div class=\"toolbar\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.panels = [];
            this.burndownInstance = Wegas.Facade.Variable.cache.find("name", "burndown").getInstance();
        },
        renderUI: function() {
            if (Y.Wegas.PMGHelper.getCurrentPhaseNumber() <= 3) {
                this.get(CONTENTBOX).one(".toolbar").append("<i class=\"add-iteration fa fa-plus-square-o fa-3x\"></i>");
            }
            this.addIterationBtn = this.get(CONTENTBOX).one(".add-iteration");
            Y.Array.map(this.burndownInstance.get("iterations"), function(it) {
                this.addIteration(it);
            }, this);
        },
        addIteration: function(iteration) {
            var panel = new Wegas.PmgSlidePanel({
                title: iteration.get("name"),
                children: [{
                        type: "PmgIterationWidget",
                        iterationId: iteration.get("id"),
                        burndownInstanceId: this.burndownInstance.get("id")
                    }]
            }).render(this.get(CONTENTBOX).one(".iterations"));
            panel.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this);

            this.panels.push(panel);
        },
        bindUI: function() {
            if (this.addIterationBtn) {
                this.handlers.push(this.addIterationBtn.on("click", function() {
                    var beginAt;
                    switch (Y.Wegas.PMGHelper.getCurrentPhaseNumber()) {
                        case 1:
                        case 2:
                            beginAt = 1;
                            break;
                        case 3:
                            beginAt = Y.Wegas.PMGHelper.getCurrentPeriodNumber();
                            break;
                        default:
                            beginAt = -1;
                    }

                    Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                        this.showOverlay();
                        Wegas.Facade.Variable.sendRequest({
                            request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                            cfg: {
                                method: "POST",
                                //updateCache: false,
                                //updateEvent: false,
                                data: {
                                    "@class": "Script",
                                    content: "PMGHelper.addIteration(" + beginAt + ");"
                                }
                            },
                            on: {
                                success: Y.bind(function(e) {
                                    this.addIteration(e.response.entities[0]);
                                    this.syncUI();
                                    this.hideOverlay();
                                }, this),
                                failure: Y.bind(this.hideOverlay, this)
                            }
                        });

                    }, this));
                }, this));
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
            Y.Array.each(this.panels, function(p) {
                p.destroy();
            });
            this.addIterationBtn.destroy();
        }
    });
});
