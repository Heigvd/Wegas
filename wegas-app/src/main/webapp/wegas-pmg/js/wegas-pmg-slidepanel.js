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
                if(this.get("openByDefault")){
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
        },
        {
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
                            content: "<div class=\"pmg-legend\">\n<div><div class=\"worked\">&nbsp;</div>\nWorked</div>\n<div><div class=\"booked\">&nbsp;</div>\nAssigned</div>\n<div>\n<div class=\"unavailable\">&nbsp;</div>\nNot Available</div>\n<div>\n<div class=\"engagementDelay\">&nbsp;</div>\nDelay to assign/unassign</div>\n</div>"
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
});
