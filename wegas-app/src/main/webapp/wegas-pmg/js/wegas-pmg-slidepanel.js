/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-pmg-slidepanel", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", SlidePanel, Wegas = Y.Wegas;

    SlidePanel = Y.Base.create("wegas-pmg-slidepanel", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
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

            if (this.get("animation")) {                                        // Slide animation
                this.animation = cb.plug(Y.Plugin.NodeFX, {
                    from: {
                        height: 0
                    },
                    to: {
                        height: function(node) {                                // dynamic in case of change
                            return node.get('scrollHeight');                    // get expanded height (offsetHeight may be zero)
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
            if (!cb.get("parentElement").hasClass("wegas-slidepanel-toggled")) {
                cb.ancestor().one(".slidepanel-cleaner").setStyle('height', cb.get('scrollHeight')); //compensates the non-height of the content's absolute position.
            }
        },
        destructor: function() {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
            if (this.get('animation')) {
                this.animation.destroy();
                this.cleaner.destroy();
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
            }
        }
    });
    Wegas.PmgSlidePanel = SlidePanel;

    /**
     * Shortcut to create a slidepanel for each resource folders available.
     */
    Wegas.PmgResourcesPanels = Y.Base.create("wegas-pmg-resourcespanels", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
        renderUI: function() {
            var resourceFoldes = Wegas.Facade.Variable.cache.find("name", "employees");

            this.panels = Y.Array.map(resourceFoldes.get("items"), function(vd) {
                var autoDesc = Y.Wegas.Facade.Variable.cache.find("name", "autoReservation"), // Ensure variable exists
                    autoReserve = autoDesc && autoDesc.getInstance().get("value"),
                    pmgPanel;


                pmgPanel = new Wegas.PmgSlidePanel({
                    title: vd.get("label"),
                    children: [{
                            type: "PmgDatatable",
                            plugins: [{
                                    fn: "ScheduleDT",
                                    cfg: {
                                        variable: {
                                            name: "periodPhase3"
                                        },
                                        autoReservation: autoReserve
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
                                    fn: "Reservation"
                                }, {
                                    fn: "OccupationColor",
                                    cfg: {
                                        autoReservation: autoReserve
                                    }
                                }, {
                                    fn: "ActivityColor"
                                }],
                            variable: {
                                name: vd.get("name")
                            },
                            columnsCfg: [{
                                    key: "label",
                                    label: "Name",
                                    sortable: true,
                                    allowHTML: true
                                }, {
                                    name: "grade",
                                    label: "Grade",
                                    formatter: "skillLevel",
                                    key: "instance.skillsets",
                                    sortable: true,
                                    allowHTML: true
                                }, {
                                    name: "Wage",
                                    label: "Monthly wages",
                                    key: "instance.properties.wage",
                                    sortable: true,
                                    allowHTML: true
                                }, {
                                    name: "Rate",
                                    label: "Rate",
                                    key: "instance.properties.activityRate",
                                    sortable: true,
                                    allowHTML: true
                                }, {
                                    name: "Motiv",
                                    label: "Motiv.",
                                    key: "instance.moral",
                                    sortable: true,
                                    allowHTML: true
                                }],
                            defaultSort: null
                        }, {
                            type: "Text",
                            content: "<div class=\"pmg-legend\">\n<div>\n<div class=\"engagementDelay\">&nbsp;</div>\nDelayed</div>\n<div>\n<div class=\"editable\">&nbsp;</div>\nAssigned</div>\n<div>\n<div class=\"notEditable\">&nbsp;</div>\nAway</div>\n</div>"
                        }]
                }).render(this.get(CONTENTBOX));

                if (autoReserve) {
                    pmgPanel.item(0).plug(Y.Plugin.AutoReservationColor, {
                        taskList: {
                            name: "tasks"
                        }
                    });
                }

                return pmgPanel;
            }, this);
        },
        destructor: function() {
            Y.Array.each(this.panels, function(p) {
                p.destroy();
            });
        }
    });

});