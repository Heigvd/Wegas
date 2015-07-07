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
/*global YUI*/
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
                this.handlers = {};
                this.get("boundingBox").one(".slidepanel-title h2").setContent(this.get("title"));
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
    Wegas.PmgIterationPanel = Y.Base.create("wegas-pmg-iteration-panel", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"iteration-tasks\">" +
            "<div class=\"iteration-tasks-list\"></div>" +
            "<div class=\"iteration-tasks-toolbar\"></div>" +
            "</div>" +
            "<div class=\"iteration-chart\">" +
            "<canvas class='chart' width='600' height='400'></canvas>" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.get("iteration");
        },
        /*
         var data = {
         labels: ["January", "February", "March", "April", "May", "June", "July"],
         datasets: [
         {
         label: "My First dataset",
         fillColor: "rgba(220,220,220,0.2)",
         strokeColor: "rgba(220,220,220,1)",
         pointColor: "rgba(220,220,220,1)",
         pointStrokeColor: "#fff",
         pointHighlightFill: "#fff",
         pointHighlightStroke: "rgba(220,220,220,1)",
         data: [65, 59, 80, 81, 56, 55, 40]
         },
         {
         label: "My Second dataset",
         fillColor: "rgba(151,187,205,0.2)",
         strokeColor: "rgba(151,187,205,1)",
         pointColor: "rgba(151,187,205,1)",
         pointStrokeColor: "#fff",
         pointHighlightFill: "#fff",
         pointHighlightStroke: "rgba(151,187,205,1)",
         data: [28, 48, 40, 19, 86, 27, 90]
         }
         ]
         };
         
         
         
         
         */
        renderUI: function() {
            var iteration = this.get("iteration"),
                data = {
                    labels: [],
                    datasets: []
                };

            iteration.get("");
            this.ctx = this.get("contentBox").one(".iteration-chart canvas.chart").getDOMNode().getContext("2d"),
                this.chart = new Chart(this.ctx).Line(data, {
                //                         responsive: true,
                bezierCurve: false,
                animation: false,
                scaleOverride: true,
                scaleLabel: "<%=value%>%",
                scaleSteps: 10,
                scaleStepWidth: 10,
                scaleStartValue: 0
            });
        }
    }, {
        ATTRS: {
            iteration: {
                type: "object"
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
                        type: "PMGIterationPanel",
                        iteration: iteration
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

                    Wegas.Facade.Variable.sendRequest({
                        request: "/Burndown/" + this.burndownInstance.get("id") + "/",
                        cfg: {
                            method: "POST",
                            data: {
                                "@class": "Iteration",
                                "name": "New Iteration",
                                "beginAt": beginAt
                            }
                        },
                        on: {
                            success: Y.bind(this.addIteration, this)
                        }
                    });
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
