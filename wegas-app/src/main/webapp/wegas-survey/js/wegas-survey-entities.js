/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @author Jarle Hulaas
 */
YUI.add('wegas-survey-entities', function(Y) {
    "use strict";
    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", ENUM = "enum",
        SELF = "self", BOOLEAN = "boolean", BUTTON = "Button", OBJECT = "object",
        HTML = "html", SCRIPT = "script", NUMBER = "number",
        NULLSTRING = ["null", STRING],
        STATUS_NOT_STARTED  ="NOT_STARTED",
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        VERSION_ATTR_DEF,
        SELFARG,
        IDATTRDEF;
    VERSION_ATTR_DEF = {
        type: NUMBER,
        view: {
            type: HIDDEN
        }
    };
    IDATTRDEF = {
        type: NUMBER,
        optional: true, // The id is optional for entities that have not been persisted
        view: {
            type: HIDDEN
        }
    };
    SELFARG = {
        type: 'identifier',
        value: 'self',
        view: {type: HIDDEN}
    };
    /**
     * SurveyDescriptor mapper
     */
    persistence.SurveyDescriptor = Y.Base.create("SurveyDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        getIconCss: function() {
            return 'fa fa-bar-chart fa-1';
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "SurveyDescriptor"
            },
            name: {
                type: STRING,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Script alias',
                    description: "Internal name"
                }
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -1,
                description: "Displayed to players",
                type: STRING
            }),
            description: Y.Wegas.Helper.getTranslationAttr({
                type: HTML,
                label: "Introductory description"
            }),
            descriptionEnd: Y.Wegas.Helper.getTranslationAttr({
                type: HTML,
                label: "Closing remarks"
            }),
            items: {
                type: ARRAY,
                value: [],
                items: {
                    type: OBJECT,
                    value: {
                        "@class": "SurveySectionDescriptor"
                    },
                    index: 1,
                },
                view: {
                    label: 'Sections',
                    type: HIDDEN
                }
            },
            defaultInstance: {
                type: OBJECT,
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "SurveyInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: STRING,
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            label: 'Active from start'
                        }
                    },
                    status: {
                        type: STRING,
                        value: STATUS_NOT_STARTED,
                        view: {type: HIDDEN}
                    }
                },
                index: 3
            }
        },
        EDITMENU: {
            addBtn: {
                index: 1,
                maxVisibility: "PROTECTED",
                cfg: {
                    type: BUTTON,
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: [{
                                    type: BUTTON,
                                    label: "<span class='fa fa-map'></span> Section",
                                    plugins: [{
                                            fn: "AddEntityChildAction",
                                            cfg: {
                                                targetClass: "SurveySectionDescriptor"
                                            }
                                        }]

                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },

        /**
         * Defines methods available in wysiwyg script editor
         */
        METHODS: {
            activate: {
                arguments: [SELFARG]
            },
            deactivate: {
                label: "deactivate",
                arguments: [SELFARG]
            },
            isActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isNotActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            request: {
                arguments: [SELFARG]
            },
            isOngoing: {
                label: "is ongoing",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isNotOngoing: {
                label: "is not ongoing",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            complete: {
                arguments: [SELFARG]
            },
            isCompleted: {
                label: "has been completed",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isNotCompleted: {
                label: "has not been completed",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            close: {
                arguments: [SELFARG]
            },
            isClosed: {
                label: "has been closed",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isNotClosed: {
                label: "has not been closed",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
        }
    });
    /**
     * SurveyInstance mapper
     */
    Wegas.persistence.SurveyInstance = Y.Base.create("SurveyInstance", Wegas.persistence.VariableInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyInstance"
            },
            active: {
                value: true,
                type: BOOLEAN
            },
            status: {
                type: STRING,
                value: STATUS_NOT_STARTED,
                view: {type: HIDDEN}
            }
        }
    });
    
    /**
     * SurveySectionDescriptor
     */
    persistence.SurveySectionDescriptor = Y.Base.create("SurveySectionDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        getParentDescriptor: function() {
            return Wegas.Facade.Variable.cache.findById(this.get("parentId"));
        },
        getIconCss: function() {
            return "fa fa-map";
        }
    }, {
        EDITORNAME: "Section",
        ATTRS: {
            "@class": {
                value: "SurveySectionDescriptor"
            },
            name: {
                type: STRING,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Script alias',
                    description: "Internal name",
                }
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -1,
                description: "Displayed to players",
                type: STRING
            }),
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description section",
                index: 1,
                type: HTML
            }),
            items: {
                type: ARRAY,
                value: [],
                items: {
                    type: OBJECT,
                    value: {
                        "@class": "SurveyInputDescriptor"
                    },
                    index: 1,
                },
                view: {
                    label: 'Inputs',
                    type: HIDDEN
                }
            },
            index: {
                type: NUMBER,
                view: {
                    label: "Index of this section",
                    type: HIDDEN
                }
            },
            defaultInstance: {
                type: OBJECT,
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "SurveySectionInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: STRING,
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            className: 'wegas-advanced-feature',
                            label: 'Active from start'
                        }
                    },
                },
                index: 3,
            }
        },
        EDITMENU: {
            addBtn: {
                index: 1,
                maxVisibility: "PROTECTED",
                cfg: {
                    type: BUTTON,
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: [{
                                    type: BUTTON,
                                    label: "<span class='fa fa-paragraph'></span> Text input",
                                    plugins: [{
                                            fn: "AddEntityChildAction",
                                            cfg: {
                                                targetClass: "SurveyTextDescriptor"
                                            }
                                        }]
                                    },{
                                    type: BUTTON,
                                    label: "<span class='fa wegas-icon-numberdescriptor'></span> Number input",
                                    plugins: [{
                                            fn: "AddEntityChildAction",
                                            cfg: {
                                                targetClass: "SurveyNumberDescriptor"
                                            }
                                        }]
                                    },{
                                    type: BUTTON,
                                    label: "<span class='fa fa-list-ul'></span> Choice selection",
                                    plugins: [{
                                            fn: "AddEntityChildAction",
                                            cfg: {
                                                targetClass: "SurveyChoicesDescriptor"
                                            }
                                        }]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    });

    /**
     * SurveySectionInstance
     */
    persistence.SurveySectionInstance = Y.Base.create("SurveySectionInstance", Wegas.persistence.VariableInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveySectionInstance"
            },
            active: {
                value: true,
                type: BOOLEAN
            }
        }
    });
    

    
    /**
     * SurveyInputDescriptor
     */
    persistence.SurveyInputDescriptor = Y.Base.create("SurveyInputDescriptor", persistence.VariableDescriptor, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyInputDescriptor"
            },
            name: {
                type: STRING,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Script alias',
                    description: "Internal name"
                }
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -1,
                description: "Displayed to players",
                type: STRING
            }),
            index: {
                type: NUMBER,
                view: {
                    label: "Index",
                    type: HIDDEN
                }
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description",
                type: HTML,
                index: 2
            })
        }
    });
    
    
    
   
    /**
     * SurveyTextDescriptor
     */
    persistence.SurveyTextDescriptor = Y.Base.create("SurveyTextDescriptor", persistence.SurveyInputDescriptor, [], {
        getIconCss: function() {
            return 'fa fa-paragraph';
        }
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyTextDescriptor"
            },
            defaultInstance: {
                type: OBJECT,
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "SurveyTextInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: STRING,
                        view: {type: HIDDEN}
                    },
                    isReplied: {
                        type: BOOLEAN,
                        value: false,
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            className: 'wegas-advanced-feature',
                            label: 'Active from start'
                        }
                    }
                },
                index: 3
            }
        }
    });
    
    /**
     * SurveyNumberDescriptor
     */
    persistence.SurveyNumberDescriptor = Y.Base.create("SurveyNumberDescriptor", persistence.SurveyInputDescriptor, [], {
        getMaxValue: function() {
            return this.get("maxValue");
        },
        getMinValue: function() {
            return this.get("minValue");
        },
        getIconCss: function() {
            return 'fa wegas-icon-numberdescriptor';
        }
    }, {
        EDITORNAME: 'Number',
        ATTRS: {
            "@class": {
                value: "SurveyNumberDescriptor"
            },
            minValue: {
                type: ['null', NUMBER],
                optional: true,
                errored: function(val, formVal) {
                    var errors = [],
                        max = (typeof formVal.maxValue === 'number') ? formVal.maxValue : Infinity,
                        min = (typeof val === 'number') ? val : -Infinity;
                    if (min > max) {
                        errors.push('Minimum is greater than maximum');
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Minimum',
                    placeholder: "-∞",
                    layout: 'shortInline'
                }
            },
            maxValue: {
                type: ['null', NUMBER],
                optional: true,
                errored: function(val, formVal) {
                    var errors = [],
                        max = (typeof val === 'number') ? val : Infinity,
                        min = (typeof formVal.minValue === 'number') ? formVal.minValue : -Infinity;
                    if (max < min) {
                        errors.push('Maximum is less than minimum');
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Maximum',
                    placeholder: "∞",
                    layout: 'shortInline'
                }
            },
            isScale: {
                type: BOOLEAN,
                value: false,
                errored: function(val, formVal) {
                    var errors = [];
                    if (val && (formVal.maxValue === null || formVal.minValue === null)) {
                        errors.push(['This requires a Minimum and a Maximum']);
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Present as a scale'
                }
            },
            unit: Y.Wegas.Helper.getTranslationAttr({
                label: "Measurement unit",
                description: "Displayed to players",
                type: STRING,
                visible: function(val, formVal) {
                    return !formVal.isScale;
                },
            }),
            defaultInstance: {
                type: OBJECT,
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "SurveyNumberInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: STRING,
                        view: {type: HIDDEN}
                    },
                    isReplied: {
                        type: BOOLEAN,
                        value: false,
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            className: 'wegas-advanced-feature',
                            label: 'Active from start'
                        }
                    }
                },
                index: 3
            }
        }
    });
    
    
    /**
     * SurveyChoicesDescriptor
     */
    persistence.SurveyChoicesDescriptor = Y.Base.create("SurveyChoicesDescriptor", persistence.SurveyInputDescriptor, [], {
        getLabelForName: function(name) {
            var choices = this.get("choices"),
                i;
            for (i in choices) {
                if (choices[i].get("name") === name) {
                    return I18n.t(choices[i].get("label"));
                }
            }
        },
        getIconCss: function() {
            return "fa fa-list-ul";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyChoicesDescriptor"
            },
            choices: {
                type: ARRAY,
                items: {
                    type: "object",
                    properties: {
                        "@class": {
                            type: STRING,
                            value: "EnumItem",
                            view: {type: HIDDEN}
                        },
                        id: IDATTRDEF,
                        refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                        parentId: IDATTRDEF,
                        parentType: {
                            type: STRING,
                            view: {type: HIDDEN}
                        },
                        name: {
                            type: STRING,
                            errored: function(val, formVal) {
                                var errors = [];
                                if (val === undefined || val.length === 0) {
                                    errors.push('This field cannot be empty');
                                } else if (val.match(/^[\w_-]*$/) === null) {
                                    errors.push('Only letters, digits and characters "_" and "-" are allowed.');
                                }
                                return errors.join(', ');
                            },
                            view: {
                                label: 'Value',
                                description: "The reported, language-independent value (text or number)"
                            }
                        },
                        label: Y.Wegas.Helper.getTranslationAttr({
                            label: "Label",
                            index: -1,
                            description: "Displayed to players. To show images stored in the \"Files\" area, follow this scheme: <img data-file=\"filename.png\">",
                            type: STRING
                        })
                    }
                },
                index: 10,
                view: {
                    label: 'Choices',
                    sortable: true,
                    highlight: true,
                }
            },
            maxSelectable: {
                type: NUMBER,
                value: 1,
                index: 11,
                view: {
                    label: "Max. selectable items",
                }
            },
            isScale: {
                type: BOOLEAN,
                value: false,
                index: 12,
                errored: function(val, formVal) {
                    var errors = [];
                    if (val && (formVal.maxSelectable !== 1)) {
                        errors.push(['Max. selectable must be equal to 1 for the scale to work.']);
                    }
                    if (val && (!formVal.choices || formVal.choices.length < 2)) {
                        errors.push(['The scale representation requires the user to have at least two choices.']);
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Present as a scale'
                }
            },
            isSlider: {
                type: BOOLEAN,
                value: false,
                index: 12,
                visible: function(val, formVal) {
                    return formVal.isScale;
                },
                view: {
                    label: 'Show analogic slider'
                }
            },
            defaultInstance: {
                type: OBJECT,
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "SurveyChoicesInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: STRING,
                        view: {type: HIDDEN}
                    },
                    isReplied: {
                        type: BOOLEAN,
                        value: false,
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            className: 'wegas-advanced-feature',
                            label: 'Active from start'
                        }
                    }
                }
            }
        }
    });
    
    
    /**
     * SurveyInputInstance
     */
    persistence.SurveyInputInstance = Y.Base.create("SurveyInputInstance", persistence.VariableInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyInputInstance"
            },
            active: {
                value: true,
                type: BOOLEAN,
                view: {type: HIDDEN}
            },
            isReplied: {
                type: BOOLEAN,
                value: false,
                view: {type: HIDDEN}
            }
        }
    });
    
    persistence.SurveyNumberInstance = Y.Base.create("SurveyNumberInstance", persistence.SurveyInputInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyNumberInstance"
            }
        }
    });

    persistence.SurveyTextInstance = Y.Base.create("SurveyTextInstance", persistence.SurveyInputInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyTextInstance"
            }
        }
    });

    persistence.SurveyChoicesInstance = Y.Base.create("SurveyChoicesInstance", persistence.SurveyInputInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "SurveyChoicesInstance"
            }
        }
    });
   
});

