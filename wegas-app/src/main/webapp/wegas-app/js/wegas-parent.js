/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-parent", function(Y) {
    "use strict";
    var BUTTON = "Button";
    /**
     * @extends Y.Wegas.Widget
     * @constructor
     * @returns {undefined}
     */
    function Parent() {
        Y.Wegas.Widget.apply(this, arguments);
        /*Check for Y.WidgetParent*/
        if (!this._add) {
            Y.log("Extension 'Y.WidgetParent' must be defined before Y.Wegas.Parent in " + this.constructor.NAME,
                "error", "Y.Wegas.Parent");
        }
        /*Check for Y.Wegas.Editable*/
        if (!this.toJSON) {
            Y.log("Extension 'Y.Wegas.Editable' must be defined before Y.Wegas.Parent in " + this.constructor.NAME,
                "error", "Y.Wegas.Parent");
        }
        this.onceAfter("render", function() {
            this.get("boundingBox").addClass("wegas-parent");
        });
    }

    /* Copy prototype , extension -> no proto chain copy // 'extends' */
    Y.mix(Parent.prototype, Y.Wegas.Widget.prototype);
    /* And override it */
    Y.mix(Parent.prototype, {
        /**
         * @function
         * @public
         * @return object
         * @description Children serialization
         */
        toObject: function() {
            var i, object,
                children = [],
                args = Array.prototype.slice.call(arguments);
            object = Y.Wegas.Editable.prototype.toObject.apply(this, args);
            object.children = this.getChildren(args);
            return object;
        },
        getChildren: function(args) {
            var i, children = [];
            for (i = 0; i < this.size(); i = i + 1) {
                children.push(this.item(i).toObject(args));
            }
            return children;
        },
        getEditorLabel: function() {
            return;
        }
    }, true);
    Y.mix(Parent, {
        ATTRS: Y.mix({
            defaultChildType: {
                value: "Text",
                "transient": true
            },
            children: {
                "transient": true,
                type: "array",
                getter: function(v) {
                    return this.getChildren();
                },
                value: [],
                view: {type: "hidden"}
            },
            root: {
                "transient": true
            },
            parent: {
                "transient": true
            }
        }, Y.Wegas.Widget.ATTRS),
        EDITMENU: Y.mix({
            addBtn: {
                index: 10,
                cfg: {
                    type: BUTTON,
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                //menuCfg: {
                                //    points: ["tl", "tr"]
                                //},
                                //event: "mouseenter",
                                children: [{
                                        type: BUTTON,
                                        label: "Static",
                                        plugins: [{
                                                fn: "WidgetMenu",
                                                cfg: {
                                                    menuCfg: {
                                                        points: ["tl", "tr"]
                                                    },
                                                    event: "mouseenter",
                                                    children: [{
                                                            type: BUTTON,
                                                            label: "Box",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childCfg: {
                                                                            type: "Box",
                                                                            plugins: [{
                                                                                    fn: "CSSBackground",
                                                                                    cfg: {
                                                                                        styles: {
                                                                                            backgroundColor: "#c8c8c8"
                                                                                        }
                                                                                    }
                                                                                }]
                                                                        }
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Line",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childCfg: {
                                                                            type: "Line"
                                                                        }
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Text",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "Text"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Image",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "Image"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: BUTTON,
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: BUTTON
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Preferences button",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "LoginButton"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Form",
                                                            cssClass: "experimental",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "Form"
                                                                    }
                                                                }]
                                                        }]
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: "Input",
                                        plugins: [{
                                                fn: "WidgetMenu",
                                                cfg: {
                                                    menuCfg: {
                                                        points: ["tl", "tr"]
                                                    },
                                                    event: "mouseenter",
                                                    children: [{
                                                            type: BUTTON,
                                                            label: "Text",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "TextInput"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "String",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "StringInput"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Number",
                                                            plugins: [{
                                                                    fn: "WidgetMenu",
                                                                    cfg: {
                                                                        menuCfg: {
                                                                            points: ["tl", "tr"]
                                                                        },
                                                                        event: "mouseenter",
                                                                        children: [{
                                                                                type: BUTTON,
                                                                                label: "Standard Number Input",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "NumberInput"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Boxes",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "BoxesNumberInput"
                                                                                        }
                                                                                    }]
                                                                            }]
                                                                    }
                                                                }]
                                                        }]
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: "Variable",
                                        plugins: [{
                                                fn: "WidgetMenu",
                                                cfg: {
                                                    menuCfg: {
                                                        points: ["tl", "tr"]
                                                    },
                                                    event: "mouseenter",
                                                    children: [{
                                                            type: BUTTON,
                                                            label: "Number",
                                                            plugins: [{
                                                                    fn: "WidgetMenu",
                                                                    cfg: {
                                                                        menuCfg: {
                                                                            points: ["tl", "tr"]
                                                                        },
                                                                        event: "mouseenter",
                                                                        children: [{
                                                                                type: BUTTON,
                                                                                label: "Value",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "NumberTemplate"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Boxes",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "BoxTemplate"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Gauge",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "GaugeDisplay"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Serie",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "ValueboxTemplate"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Fraction",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "FractionTemplate"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Custom",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "Template"
                                                                                        }
                                                                                    }]
                                                                            }]
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Text",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "TextTemplate"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Question folder",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "MCQTabView"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Single Open Question",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "WhView"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Inbox (tabview)",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "InboxDisplay"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Inbox (list)",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "InboxList"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Dialogue",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "SimpleDialogue"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Dialogue Folder",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "DialogueFolder"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Chart",
                                                            cssClass: "experimental",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "Chart"
                                                                    }
                                                                }]
                                                        },
                                                        {
                                                            type: BUTTON,
                                                            label: "Review",
                                                            cssClass: "wegas-advanced-feature",
                                                            plugins: [{
                                                                    fn: "WidgetMenu",
                                                                    cfg: {
                                                                        menuCfg: {
                                                                            points: ["tl", "tr"]
                                                                        },
                                                                        event: "mouseenter",
                                                                        children: [{
                                                                                type: BUTTON,
                                                                                label: "Variable Editor",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "ReviewVariableEditor"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Reviewing Panel",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "ReviewTabView"
                                                                                        }
                                                                                    }]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Orchestrator",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "ReviewOrchestrator"
                                                                                        }
                                                                                    }]
                                                                            }
                                                                        ]
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Survey",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "SurveyWidget"
                                                                    }
                                                                }]
                                                        }
                                                    ]
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: "Layouts",
                                        plugins: [{
                                                fn: "WidgetMenu",
                                                cfg: {
                                                    menuCfg: {
                                                        points: ["tl", "tr"]
                                                    },
                                                    event: "mouseenter",
                                                    children: [{
                                                            type: BUTTON,
                                                            label: "Page display",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "PageLoader"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "List",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "FlexList"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Float List",
                                                            cssClass: "wegas-advanced-feature",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "List"
                                                                    }
                                                                }]
                                                        },
                                                        {
                                                            type: BUTTON,
                                                            label: "SlideShow",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childCfg: {
                                                                            type: "ChoiceList",
                                                                            plugins: [{
                                                                                    fn: "SlideShow"
                                                                                }]
                                                                        }
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Tabview",
                                                            cssClass: "wegas-advanced-feature",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "TabView"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Choice list",
                                                            cssClass: "wegas-advanced-feature",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "ChoiceList"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Absolute layout",
                                                            cssClass: "wegas-advanced-feature",
                                                            plugins: [{
                                                                    fn: "AddChildWidgetAction",
                                                                    cfg: {
                                                                        childType: "AbsoluteLayout"
                                                                    }
                                                                }]
                                                        }, {
                                                            type: BUTTON,
                                                            label: "Menu",
                                                            plugins: [{
                                                                    fn: "WidgetMenu",
                                                                    cfg: {
                                                                        menuCfg: {
                                                                            points: ["tl", "tr"]
                                                                        },
                                                                        event: "mouseenter",
                                                                        children: [{
                                                                                type: BUTTON,
                                                                                label: "Menu Layout",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "LayoutMenu"
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }, {
                                                                                type: BUTTON,
                                                                                label: "Language Selection Menu",
                                                                                plugins: [{
                                                                                        fn: "AddChildWidgetAction",
                                                                                        cfg: {
                                                                                            childType: "I18nMenu"
                                                                                        }
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                }]
                                                        }

                                                    ]
                                                }
                                            }]
                                    }]
                            }
                        }]
                },
            },
            deleteBtn: {
                index: 30,
                cfg: {
                    type: BUTTON,
                    label: "Delete",
                    plugins: [{
                            fn: "DeleteLayoutWidgetAction"
                        }]
                }
            }
        }
        , Y.Wegas.Widget.EDITMENU),
        _buildCfg: {}
    });
    Y.namespace("Wegas").Parent = Parent;
});
