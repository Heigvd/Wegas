/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * 
 * @fileOverview Widgets for PMG BurndownsA
 * @author maxence.laurent gmail.com
 */
/*global YUI, Chartist */
YUI.add("wegas-pmg-burndown", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Wegas = Y.Wegas;

    /**
     * Shortcut to create a slidepanel for each iteration.
     */
    Wegas.PmgIterationWidget = Y.Base.create("wegas-pmg-iteration-widget", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
        CONTENT_TEMPLATE: "<div class=\"wegas-chart\">" +
            "<div class=\"iteration-config\">" +
            "<div class=\"begin-at-container\">" +
            "<span class=\"begin-at-label\"></span>" +
            "<div class=\"begin-at-input-container\">" +
            "<input class=\"begin-at-input\" />" +
            "</div>" +
            "</div>" +
            "<div class=\"iteration-tasks\">" +
            "<div class=\"iteration-tasks-title\">Tasks:</div>" +
            "<div class=\"iteration-tasks-list\"></div>" +
            "<div class=\"iteration-tasks-toolbar\"></div>" +
            "</div>" +
            "</div>" +
            "<div class=\"iteration-chart\">" +
            "<div class=\"chart ct-chart\"></div>" +
            //"<canvas class='chart' width='400' height='200'></canvas>" +
            "<div class=\"iteration-planning\">" +
            "<div class=\"planning-initial\" style=\"clear: both;\"></div>" +
            "<div class=\"planning-ongoing\" style=\"clear: both;\"></div>" +
            "</div>" +
            "<div class=\"planning-tools\"\"></div>" +
            "<div class=\"legend\" style=\"clear: both;\">" +
            "</div>" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
            this.get(CONTENTBOX).one(".chart").addClass("chart-" + this.getIteration().get("id"));
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
                if (iterations.hasOwnProperty(i)) {
                    if (iterations[i].get("id") === targetId) {
                        return iterations[i];
                    }
                }
            }
            return null;
        },
        getInterpolatedPeriodNumber: function(x1, y1, y2) {
            return x1 + -y1 / (y2 - y1);
        },
        syncUI: function() {
            var CB = this.get(CONTENTBOX),
                iteration = this.getIteration(),
                totalWorkload,
                remainingWorkload = 0,
                minPeriod, maxPeriod,
                status = iteration.getStatus(),
                //currentPhase = Y.Wegas.PMGHelper.getCurrentPhaseNumber(),
                currentPeriod = Y.Wegas.PMGHelper.getCurrentPeriodNumber(),
                period,
                planning = iteration.get("plannedWorkloads"),
                replanning = iteration.get("replannedWorkloads"),
                workloads = iteration.get("workloads"),
                retroPlanning,
                retroSum,
                retroSerie = [],
                planningSerie = [],
                effectiveSerie = [],
                replanningSerie = [],
                tasks = iteration.getTaskDescriptors(),
                taskD, i, node, wl,
                x,
                projectedWorkload, parentBB;

            parentBB = this.get("parent").get("boundingBox");
            if (status === "NOT_STARTED") {
                parentBB.addClass("iteration-not-started");
                if (!CB.one(".iteration-config .rm-iteration")) {
                    CB.one(".iteration-config").append("<i class=\"rm-iteration fa fa-minus-square-o fa-2x\"></i>");
                }
                CB.one(".legend").setContent("<div>" +
                    "<span class=\"color ct-series-a\"></span><span class=\"label\">Planned</span>" +
                    "</div>");
            } else {
                CB.one(".legend").setContent("<div>" +
                    "<span class=\"color ct-series-a\"></span><span class=\"label\">Planned</span>" +
                    "</div>" +
                    "<div>" +
                    "<span class=\"color ct-series-b\"></span><span class=\"label\">Realized</span>" +
                    "</div>" +
                    "<div>" +
                    "<span class=\"color ct-series-c\"></span><span class=\"label\">Projection</span>" +
                    "</div>" +
                    "<div>" +
                    "<span class=\"color ct-series-d\"></span><span class=\"label\">Spent</span>" +
                    "</div>");
                if (status === "STARTED") {
                    if (CB.one(".iteration-config .rm-iteration")) {
                        CB.one(".iteration-config .rm-iteration").remove();
                    }
                    parentBB.removeClass("iteration-not-started");
                    parentBB.addClass("iteration-started");
                } else {
                    if (CB.one(".iteration-config .rm-iteration")) {
                        CB.one(".iteration-config .rm-iteration").remove();
                    }
                    parentBB.removeClass("iteration-not-started");
                    parentBB.removeClass("iteration-started");
                    parentBB.addClass("iteration-completed");
                }
            }

            node = CB.one(".iteration-tasks-list");
            node.setContent("");
            for (i = 0; i < tasks.length; i += 1) {
                taskD = tasks[i];
                node.append("<em class='task' taskId=" + taskD.get("id") + ">" +
                    "<span class='label'>" + taskD.get("index") + "</span>" +
                    (status === "NOT_STARTED" ? "<div class='menu'><span class='remove'></span></div>" : "") +
                    "</em>");
            }

            CB.one(".iteration-tasks-toolbar").set("content", "<div class=\"tasks\"></div>");

            minPeriod = Math.min(Math.min.apply(null, iteration.get("workloads").map(function(e) {
                return e.get("val.periodNumber");
            })),
                this.getMinKey(replanning),
                iteration.get("beginAt"));

            maxPeriod = Math.max(Math.max.apply(null, iteration.get("workloads").map(function(e) {
                return e.get("val.periodNumber");
            })),
                this.getMaxKey(replanning),
                iteration.get("beginAt") + this.getMaxKey(planning), iteration.get("beginAt") + 4) + 1;

            // edit beginAt only available when iteration has not started yet
            if (status === "NOT_STARTED") {
                CB.one(".begin-at-label").setContent("Will begin at period: ");
                CB.one(".begin-at-input").set("value", iteration.get("beginAt"));
                CB.one(".iteration-tasks-toolbar").setContent("<span class=\"add\"></span>");
            } else {
                CB.one(".begin-at-label").setContent("Began at period: ");
                this.get(CONTENTBOX).one(".begin-at-input-container").setContent('<p>' +
                    minPeriod + '</p>');
            }

            totalWorkload = iteration.getTotalWorkload();

            if (status === "STARTED") {
                // On Going or completed iteration
                remainingWorkload = iteration.get("workloads")[currentPeriod];
            } else if (status === "NOT_STARTED") {
                remainingWorkload = totalWorkload;
            }

            node = CB.one(".planning-initial");
            node.setContent("");

            CB.one(".planning-tools").setContent("");

            /*
             * Compute initial planning serie
             */
            projectedWorkload = totalWorkload;
            for (period = minPeriod; period <= maxPeriod; period += 1) {
                if (projectedWorkload < 0) {

                    x = this.getInterpolatedPeriodNumber(period - 1,
                        planningSerie[planningSerie.length - 1].y, projectedWorkload);
                    projectedWorkload = 0;

                } else {
                    x = period;
                }
                planningSerie.push({
                    x: x,
                    y: projectedWorkload
                });

                if (period >= iteration.get("beginAt")) {
                    wl = planning[period - iteration.get("beginAt")] || 0;
                    wl.toFixed(2);

                    if (status === "NOT_STARTED" && (projectedWorkload > 0 || wl > 0)) {
                        // If there is something in the iteration and it still is editable 
                        // Add an input
                        this.addInput(node, "planning planning-p" + period, period, wl);
                        //node.append("<input class=\"planning planning-p" + period + "\" period=\"" + period + "\" value=\"" + wl + " \"/>");
                        //this.handlers.push(input.on("change", this.plan, this));
                    } else {
                        // Otherwise, just add a span
                        if (period < maxPeriod) {
                            node.append("<span class=\"planning\">" + wl + "</span>");
                        }
                    }
                    //projectedWorkload -= wl;
                    projectedWorkload = projectedWorkload - wl;
                } else {
                    // period < beginAt means iteration has started earlied than projected
                    // 0 workload 
                    node.append("<span class=\"planning\">0</span>");
                }
            }
            if (projectedWorkload > 0) {
                CB.one(".planning-tools").setContent("<i class=\"add-planning-input fa fa-plus-square-o\"></i>");
            }

            // If the planning is not complete (i.e. projectedWorkload > 0)
            // Add a period to show there is no more progress
            if (projectedWorkload > 0) {
                maxPeriod += 1;
                planningSerie.push({
                    x: maxPeriod,
                    y: projectedWorkload
                });
            }

            node = CB.one(".planning-ongoing");
            node.setContent("");
            if (status !== "NOT_STARTED") {
                retroPlanning = {};
                retroSum = 0;
                workloads = workloads.sort(function(a, b) {
                    return a.get("val.periodNumber") > b.get("val.periodNumber");
                });
                for (i = 0; i < workloads.length; i += 1) {
                    remainingWorkload = workloads[i].get("val.workload");
                    period = workloads[i].get("val.periodNumber");

                    wl = workloads[i].get("val.spentWorkload");
                    retroSum += wl;
                    retroPlanning[period] = (retroPlanning[period] || 0) + wl;

                    x = period - (10 - workloads[i].get("val.lastWorkedStep")) / 10;
                    wl = remainingWorkload.toFixed(2);
                    effectiveSerie.push({
                        x: x,
                        y: wl
                    });
                }

                wl = iteration.getRemainingWorkload();
                /* Iteration remainingWorkload changed since last "nextPeriod" */
                if (Math.abs(wl - remainingWorkload) > 0.0001) {
                    remainingWorkload = wl;
                    effectiveSerie.push({
                        x: period,
                        y: wl
                    });
                }

                replanningSerie.push({
                    x: period,
                    y: wl
                });


                retroSum += wl;

                // Retro
                for (period in retroPlanning) {
                    retroSerie.push({
                        x: period,
                        y: retroSum
                    });
                    retroSum -= retroPlanning[+period + 1] || 0;
                }
                for (period = minPeriod; period < currentPeriod; period += 1) {
                    node.append("<span class=\"workload\">n/a</span>");
                }

                // Replanning
                for (period = currentPeriod; period <= this.getMaxKey(replanning); period += 1) {
                    // Get replanned workload
                    wl = (replanning[period] || 0).toFixed(2);

                    if (status !== "NOT_STARTED" && (remainingWorkload > 0 || wl > 0)) {
                        //node.append("<input class=\"replanning\" period=\"" + period + "\" value=\"" + wl + " \"/>");
                        this.addInput(node, "replanning", period, wl);
                    }

                    remainingWorkload = remainingWorkload - wl;
                    if (remainingWorkload < 0) {
                        // if y value < 0, use segment (previousPeriod, previousWorkload) -> (currentPeriod, currentWorkload) to
                        // compute new x value for y=0
                        x = this.getInterpolatedPeriodNumber(period,
                            replanningSerie[replanningSerie.length - 1].y,
                            remainingWorkload);
                        remainingWorkload = 0;
                    } else {
                        x = period + 1;
                    }
                    replanningSerie.push({
                        x: x,
                        y: remainingWorkload
                    });
                }

                // Still some workload to consume, add an input
                if (status === "STARTED" && remainingWorkload > 0) {
                    //node.append("<input class=\"replanning\" period=\"" + period + "\" value=\"0\"/>");
                    this.addInput(node, "replanning", period);
                    maxPeriod = period + 1;
                    replanningSerie.push({
                        x: maxPeriod,
                        y: remainingWorkload
                    });

                    CB.one(".planning-tools").append("<i class=\"add-replanning-input fa fa-plus-square-o\"></i>");
                }
            }

            this.currentMaxPeriod = maxPeriod;

            /*
             Y.log("Min Period: " + minPeriod);
             Y.log("Max Period: " + maxPeriod);
             Y.log("Planning: " + JSON.stringify(planningSerie));
             Y.log("Retro: " + JSON.stringify(retroSerie));
             Y.log("Effective: " + JSON.stringify(effectiveSerie));
             Y.log("Replan: " + JSON.stringify(replanningSerie));
             */

            this.chart = new Chartist.Line(".chart-" + iteration.get("id"), {
                series: [{
                        name: "planning",
                        data: planningSerie
                    }, {
                        name: "effective",
                        data: effectiveSerie
                    }, {
                        name: "replan",
                        data: replanningSerie
                    }, {
                        name: "Retro",
                        data: retroSerie
                    }
                ]
            }, {
                width: 15 + (maxPeriod - minPeriod + 1) * 50,
                height: 200,
                low: 0,
                lineSmooth: Chartist.Interpolation.none(),
                showArea: true,
                axisX: {
                    type: Chartist.AutoScaleAxis,
                    onlyInteger: true
                },
                axisY: {
                    low: 0,
                    type: Chartist.AutoScaleAxis,
                    onlyInteger: true
                }
            });
        },
        addInput: function(node, klass, period, value) {
            value = value || 0;
            node.append("<input class=\"" + klass + "\" period=\"" + period + "\" value=\"" + value + " \"/>");
        },
        bindUI: function() {
            var input, CB = this.get(CONTENTBOX);

            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));

            this.handlers.push(CB.delegate("change", this.plan, "input.planning", this));
            this.handlers.push(CB.delegate("change", this.plan, "input.replanning", this));
            //this.handlers.push(CB.delegate("valuechange", this.plan, "input.planning", this));
            //this.handlers.push(CB.delegate("valuechange", this.plan, "input.replanning", this));
            this.handlers.push(CB.delegate("click", this.createMenu, ".iteration-tasks-toolbar .add", this));
            //this.handlers.push(CB.delegate("click", this.createMenu, ".iteration-tasks-toolbar .add", this));
            this.handlers.push(CB.delegate("click", this.removeTask, ".task .remove", this));
            this.handlers.push(CB.delegate("click", this.destroyIteration, ".iteration-config .rm-iteration", this));

            this.handlers.push(CB.delegate("click", Y.bind(function() {
                var node = CB.one(".planning-initial"),
                    period = this.currentMaxPeriod++;
                this.addInput(node, "planning planning-p" + period, period);
            }, this), ".add-planning-input", this));

            this.handlers.push(CB.delegate("click", Y.bind(function() {
                var node = CB.one(".planning-ongoing"),
                    period = this.currentMaxPeriod++;
                this.addInput(node, "replanning", period);
            }, this), ".add-replanning-input", this));



            input = CB.one(".begin-at-input");
            if (input) {
                this.handlers.push(input.on("change", this.updateBeginAt, this));
            }
        },
        destroyIteration: function(e) {
            this.execScript("PMGHelper.removeIteration(" + this.get("iterationId") + ");");
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
        updateBeginAt: function() {
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
        updateName: function() {
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
                            //this.syncUI();
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
                            //this.syncUI();
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
        addIteration: function(iteration, openTab) {
            var panel;
            panel = new Wegas.PmgSlidePanel({
                title: iteration.get("name"),
                children: [{
                        type: "PmgIterationWidget",
                        iterationId: iteration.get("id"),
                        burndownInstanceId: this.burndownInstance.get("id")
                    }],
                openByDefault : openTab
            }).render(this.get(CONTENTBOX).one(".iterations"));
            panel.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this);

            this.panels.push(panel);
        },
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
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
                                    this.addIteration(e.response.entities[0], true);
                                    //this.syncUI();
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
