/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
/*global Y */
Y.use(["wegas-flexitests-controller", "wegas-text", "wegas-image", "wegas-choicelist"], function(Z) {
    "use strict";
    Y.Wegas.FlexitestsController.EDITMENU = [{
            type: "Button",
            label: "Properties",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    fn: "EditWidgetAction"
                }
            ]
        }, {
            type: "Button",
            label: "Add",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    "fn": "WidgetMenu",
                    "cfg": {
                        "menuCfg": {
                            points: ["tl", "tr"]
                        },
                        "event": "mouseenter",
                        "children": [{
                                type: "Button",
                                label: "Single choice list",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childType": "ChoiceList"
                                        }
                                    }
                                ]
                            }, {
                                type: "Button",
                                label: "Image (fix point)",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childCfg": {
                                                "type": "Image",
                                                "cssClass": "fix-point",
                                                "url": "/fix-point/fix_red.png",
                                                "plugins": [{
                                                        "fn": "CSSPosition",
                                                        "cfg": {
                                                            "styles": {
                                                                "position": "absolute",
                                                                "top": "344px",
                                                                "left": "472px"
                                                            }
                                                        }
                                                    }]
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    ];
    Y.Wegas.ChoiceList.EDITMENU = [{
            type: "Button",
            label: "Properties",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    fn: "EditWidgetAction"
                }
            ]
        }, {
            type: "Button",
            label: "Add",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    "fn": "WidgetMenu",
                    "cfg": {
                        "menuCfg": {
                            points: ["tl", "tr"]
                        },
                        "event": "mouseenter",
                        "children": [{
                                type: "Button",
                                label: "Text",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childType": "Text"
                                        }
                                    }
                                ]
                            }, {
                                type: "Button",
                                label: "Image",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childType": "Image"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }, {
            type: "Button",
            label: "Delete",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    fn: "DeleteWidgetAction"
                }
            ]
        }
    ];
    Y.Wegas.List.EDITMENU = [{
            type: "Button",
            label: "Properties",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    fn: "EditWidgetAction"
                }
            ]
        }, {
            type: "Button",
            label: "Add",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    "fn": "WidgetMenu",
                    "cfg": {
                        "menuCfg": {
                            points: ["tl", "tr"]
                        },
                        "event": "mouseenter",
                        "children": [{
                                type: "Button",
                                label: "Text",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childType": "Text"
                                        }
                                    }
                                ]
                            }, {
                                type: "Button",
                                label: "Form",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childType": "Form"
                                        }
                                    }
                                ]
                            }, {
                                type: "Button",
                                label: "Results",
                                plugins: [{
                                        fn: "AddChildWidgetAction",
                                        cfg: {
                                            "childType": "FlexitestsResults"
                                        }
                                    }
                                ]
                            }

                        ]
                    }
                }
            ]
        }, {
            type: "Button",
            label: "Delete",
            cssClass: "editor-exploreGameModel-button",
            plugins: [{
                    fn: "DeleteWidgetAction"
                }
            ]
        }
    ];
    Y.Wegas.Image.ATTRS.plugins = Y.clone(Y.Wegas.Text.ATTRS.plugins);
    Y.Wegas.Image.ATTRS.plugins._inputex.items.push({
        type: "Button",
        label: "Flexitests, expected response",
        data: "FlexiResponse"
    });
});
