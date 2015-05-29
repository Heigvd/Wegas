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

                var cb = this.get(CONTENTBOX);

                this.get("boundingBox").append("<div class='slidepanel-cleaner' style='position:relative; z-index:-1;'></div>")
                    .one(".slidepanel-title h2").setContent(this.get("title"));

                cb.setStyles({
                    position: "absolute",
                    width: "100%"
                });

                if (this.get("animation")) { // Slide animation
                    this.animation = cb.plug(Y.Plugin.NodeFX, {
                        from: {
                            height: 0
                        },
                        to: {
                            height: function(node) { // dynamic in case of change
                                return node.get('scrollHeight'); // get expanded height (offsetHeight may be zero)
                            }
                        },
                        easing: Y.Easing.easeOut,
                        duration: 0.5
                    }, this);

                    this.cleaner = cb.ancestor().one(".slidepanel-cleaner").plug(Y.Plugin.NodeFX, {//compensates the non-height of the content's absolute position.
                        from: {
                            height: 0
                        },
                        to: {
                            height: function(node) {
                                return node.ancestor().one(".wegas-pmg-slidepanel-content").get('scrollHeight');
                            }
                        },
                        easing: Y.Easing.easeOut,
                        duration: 0.5
                    }, this);
                }
            },
            bindUI: function() {
                this.handlers.update = Wegas.Facade.Variable.after("update", this.syncUI, this);

                this.get("boundingBox").one(".slidepanel-title").on('click', function(e) {
                    e.preventDefault();
                    this.get("boundingBox").toggleClass("wegas-slidepanel-toggled");
                    if (this.get('animation')) {
                        this.animation.fx.set('reverse', !this.animation.fx.get('reverse')) // toggle reverse
                            .run();
                        this.cleaner.fx.set('reverse', !this.cleaner.fx.get('reverse')) // toggle reverse
                            .run();
                    }
                }, this);
            },
            syncUI: function() {
                var cb = this.get(CONTENTBOX);
                if (!cb.get("parentElement").hasClass("wegas-slidepanel-toggled") && cb.get('scrollHeight') > 0) {
                    cb.ancestor().one(".slidepanel-cleaner").setStyle('height', cb.get('scrollHeight')); //compensates
                                                                                                         // the
                                                                                                         // non-height
                                                                                                         // of the
                                                                                                         // content's
                                                                                                         // absolute
                                                                                                         // position.
                }
            },
            destructor: function() {
                var k;
                for (k in this.handlers) {
                    this.handlers[k].detach();
                }
                if (this.get('animation')) {
                    this.animation.destroy();
                    this.cleaner.destroy();
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
                                sortable: true
                            }, {
                                label: "Grade",
                                formatter: "skillLevel",
                                key: "instance.properties.level",
                                sortable: true,
                                allowHTML: true
                            }, {
                                label: "Monthly wages",
                                key: "instance.properties.wage",
                                sortable: true
                            }, {
                                label: "Rate",
                                key: "instance.properties.activityRate",
                                sortable: true
                            }, {
                                label: "Motiv.",
                                key: "instance.properties.motivation",
                                sortable: true
                            }],
                            defaultSort: null
                        }, {
                            type: "Text",
                            content: "<div class=\"pmg-legend\">\n<div>\n<div class=\"engagementDelay\">&nbsp;</div>\nDelayed</div>\n<div><div class=\"worked\">&nbsp;</div>\nWorked</div>\n<div><div class=\"booked\">&nbsp;</div>\nAssigned</div>\n<div>\n<div class=\"unavailable\">&nbsp;</div>\nNot Available</div>\n</div>"
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
