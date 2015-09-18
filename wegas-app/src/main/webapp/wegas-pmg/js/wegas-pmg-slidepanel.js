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
/*global YUI */
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
                title = Y.Template.Micro.compile(title)();
                this.handlers = {};
                this.get("boundingBox").one(".slidepanel-title h2").setContent(title);
                if (!this.get("openByDefault")) {
                    this.get("boundingBox").addClass("wegas-slidepanel-closed");
                }
            },
            bindUI: function() {
                this.handlers.update = Wegas.Facade.Variable.after("update", this.syncUI, this);
                if (this.get("animation")) {
                    this.get("boundingBox").one(".slidepanel-title").on('click', function(e) {
                        e.preventDefault();
                        this.get("boundingBox").toggleClass("wegas-slidepanel-closed");
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
                value: false,
                _inputex: {
                    label: "Open by default"
                }
            }
        }
    });
    Wegas.PmgSlidePanel = SlidePanel;


    function autoModeFormatter(o) {
        return "<label class=\"choice choice--toogle " + o.value + "\">" + 
            "<div class=\"choice__box\">" +
                "<div class=\"choice__box__display\"></div> " +
            "</div>" +
        "</label><p>" + o.value + "</p>";
    }

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
                var columns, dt, resourceFolder = Wegas.Facade.Variable.cache.find("name", "employees"),
                    autoDesc = Wegas.Facade.Variable.cache.find("name", "autoReservation"),
                    autoReserve = autoDesc && autoDesc.getInstance().get("value"); // Ensure variable exists
                //currentPhase = Wegas.Facade.Variable.cache.find("name", "currentPhase").getValue();

                columns = [{
                        key: "label",
                        label: "<%= Y.Wegas.I18n.t('pmg.resources.name').capitalize() %>",
                        sortable: false
                    }, {
                        label: "<%= Y.Wegas.I18n.t('pmg.resources.grade').capitalize() %>",
                        formatter: "skillLevel",
                        key: "instance.properties.level",
                        sortable: false,
                        allowHTML: true
                    }, {
                        label: "<%= Y.Wegas.I18n.t('pmg.resources.wage').capitalize() %>",
                        key: "instance.properties.wage",
                        sortable: false
                    }, {
                        label: "<%= Y.Wegas.I18n.t('pmg.resources.rate').capitalize() %>",
                        key: "instance.properties.activityRate",
                        sortable: false
                    }, {
                        label: "<%= Y.Wegas.I18n.t('pmg.resources.motivation').capitalize() %>",
                        key: "instance.properties.motivation",
                        sortable: false
                    }];

                if (autoReserve) {
                    columns.push({
                        label: "<%= Y.Wegas.I18n.t('pmg.resources.willWork').capitalize() %>",
                        key: "instance.properties.automaticMode",
                        sortable: false,
                        formatter: autoModeFormatter
                    });
                }

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
                                            columnPosition: (autoReserve ? 6 : 5)
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
                                columnsCfg: columns,
                                defaultSort: null
                            }, {
                                type: "Text",
                                content: "<div class=\"pmg-legend\">\n<div><div class=\"worked\">&nbsp;</div>\n<%= Y.Wegas.I18n.t('pmg.gantt.worked') %></div>\n<div><div class=\"booked\">&nbsp;</div>\n <%= Y.Wegas.I18n.t('pmg.gantt.willWork') %> </div>\n" + (autoReserve ? "<div><div class=\"maybe\">&nbsp;</div>\n <%= Y.Wegas.I18n.t('pmg.gantt.mayWork') %>  </div>\n" : "") + "<div>\n<div class=\"unavailable\">&nbsp;</div>\ <%= Y.Wegas.I18n.t('pmg.gantt.unavailable') %>  </div>\n" + (!autoReserve ? "<div>\n<div class=\"engagementDelay\">&nbsp;</div>\n<%= Y.Wegas.I18n.t('pmg.gantt.delay') %> </div>\n</div>" : "")
                            }]
                    }).render(this.get(CONTENTBOX));
                    if (autoReserve) {
                        dt = panel.item(0);
                        panel.item(0).plug(Y.Plugin.AutoReservationColor, {
                            taskList: {
                                name: "tasks"
                            }
                        });
                    } else {
                        dt = panel.item(0);
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
                                var instance, assignments, currentPeriod, occupations;
                                instance = data.get("instance");
                                instance = Y.Wegas.Facade.Variable.cache.findById(instance.descriptorId).getInstance().getAttrs();
                                assignments = instance.assignments && instance.assignments.length > 0;
                                currentPeriod = Y.Wegas.Facade.Variable.cache.find("name",
                                    "periodPhase3").getValue();
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
                Y.Array.each(this.handlers, function(h) {
                    h.detach();
                });
                Y.Array.each(this.panels, function(p) {
                    p.destroy();
                });
            }
        });
});
