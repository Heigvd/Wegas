function genMap(levels) {

    var i, ret = [], count = 0, subinc, stage, j;

    for (var i in levels) {
        var inc = count * 90,
                level = count + 1;
        ret.push({
            "type": "Text",
            "content": i,
            "plugins": [{
                    "fn": "CSSPosition",
                    "cfg": {
                        "styles": {
                            "position": "absolute",
                            "top": inc +60+ "px",
                            "left": "50px"
                        }
                    }
                }, {
                    "fn": "CSSSize",
                    "cfg": {
                        "styles": {
                            "position": "absolute",
                            "width": "500px",
                            "height": "100px"
                        }
                    }
                }, {
                    "fn": "CSSText",
                    "cfg": {
                        "styles": {
                            "color": "white"
                        }
                    }
                }]
        });
        for (j = 0; j < levels[i]; j += 1) {
            stage = "" + (j + 1);
            subinc = 60 * j;
            ret.push({
                "type": "Button",
                "label": "Stage<br /> " + level + "." + stage,
                "plugins": [{
                        "fn": "ConditionalDisable",
                        "cfg": {
                            "condition": {
                                "@class": "Script",
                                "content": "VariableDescriptorFacade.find(gameModel, \"currentLevel\").getValue(self)<" + level + stage,
                                "language": "JavaScript"
                            }
                        }
                    }, {
                        "fn": "OpenPageAction",
                        "cfg": {
                            "subpageId": level + stage,
                            "targetEvent": "click",
                            "targetPageLoaderId": "maindisplayarea"
                        }
                    }, {
                        "fn": "CSSPosition",
                        "cfg": {
                            "styles": {
                                "position": "absolute",
                                "top": 80 + inc + "px",
                                "left": 50 + subinc + "px"
                            }
                        }
                    }, {
                        "fn": "CSSSize",
                        "cfg": {
                            "styles": {
                                "position": "absolute",
                                "width": "50px",
                                "height": "50px"
                            }
                        }
                    }, {
                        "fn": "CSSText",
                        "cfg": {
                            "styles": {
                                "color": "white"
                            }
                        }
                    }, {
                        "fn": "CSSStyles",
                        "cfg": {
                            "styles": {
                                "background": "transparent",
                                "border": "1px solid white"
                            }
                        }
                    }]
            });
        }
        count += 1;
    }
    return ret;
}
JSON.stringify(genMap({
    "Level 1: Moving around": 3,
    "Level 2: Variables": 4,
    "Level 3: Functions": 1
}));



