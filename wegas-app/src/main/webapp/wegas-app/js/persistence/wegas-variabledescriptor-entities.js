/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-variabledescriptor-entities', function(Y) {
    'use strict';
    var STRING = 'string',
        HIDDEN = 'hidden',
        ARRAY = 'array',
        SELECT = 'select',
        NAME = 'name',
        SELF = 'self',
        BOOLEAN = 'boolean',
        NUMBER = 'number',
        ITEMS = 'items',
        BUTTON = 'Button',
        VALUE = 'value',
        TEXT = 'text',
        INTERNAL = "INTERNAL",
        PROTECTED = "PROTECTED",
        INHERITED = "INHERITED",
        PRIVATE = "PRIVATE",
        NONE = "NONE",
        HTML = 'html',
        NULLSTRING = ["null", STRING],
        AVAILABLE_TYPES,
        OPTIONAL_AVAILABLE_TYPES,
        Wegas = Y.Wegas,
        persistence = Wegas.persistence,
        Base = Y.Base,
        VERSION_ATTR_DEF,
        IDATTRDEF,
        SELFARG;
    VERSION_ATTR_DEF = {
        type: NUMBER,
        optional: true,
        index: -19,
        view: {
            type: 'uneditable',
            className: 'wegas-internal-feature',
            label: 'Version',
            layout: 'shortInline'
                //_type: HIDDEN
        }
    };
    IDATTRDEF = {
        type: NUMBER,
        optional: true, // The id is optional for entites that have not been persisted
        view: {
            layout: 'shortInline',
            type: HIDDEN
        }
    };
    SELFARG = {
        type: 'identifier',
        value: SELF,
        const: SELF,
        view: {type: HIDDEN}
    };
    AVAILABLE_TYPES = [
        {
            label: 'String',
            value: 'StringDescriptor'
        },
        {
            label: 'Text',
            value: 'TextDescriptor'
        },
        {
            label: 'Static Text',
            value: 'StaticTextDescriptor'
        },
        {
            label: 'Number',
            value: 'NumberDescriptor'
        },
        {
            label: 'Folder',
            value: 'ListDescriptor'
        },
        {
            label: 'Inbox',
            value: 'InboxDescriptor'
        },
        {
            label: 'Boolean',
            value: 'BooleanDescriptor'
        },
        {
            label: 'Achievement',
            value: 'AchievementDescriptor'
        },
        {
            label: 'Question',
            value: 'QuestionDescriptor'
        },
        {
            label: 'Open Question',
            value: 'WhQuestionDescriptor'
        },
        {
            label: 'Task',
            value: 'TaskDescriptor'
        },
        {
            label: 'Resource',
            value: 'ResourceDescriptor'
        },
        {
            label: 'State Machine',
            value: 'FSMDescriptor'
        },
        {
            label: 'Trigger',
            value: 'TriggerDescriptor'
        },
        {
            label: 'Dialog',
            value: 'DialogueDescriptor'
        },
        {
            label: 'Peer Review',
            value: 'PeerReviewDescriptor'
        },
        {
            label: 'Survey',
            value: 'SurveyDescriptor'
        },
        {
            label: 'Object',
            value: 'ObjectDescriptor'
        }
    ];
    persistence.AVAILABLE_TYPES = AVAILABLE_TYPES;
    OPTIONAL_AVAILABLE_TYPES = [
        {
            label: 'none',
            value: ''
        }
    ].concat(AVAILABLE_TYPES);
    persistence.OPTIONAL_AVAILABLE_TYPES = OPTIONAL_AVAILABLE_TYPES;
    /**
     * VariableDescriptor mapper
     */
    persistence.VariableDescriptor = Base.create('VariableDescriptor', persistence.Entity, [], {
        /**
         *
         */
        initializer: function() {
            persistence.VariableDescriptor.superclass.constructor.apply(
                this,
                arguments
                );
            Y.Object.each(
                this.getMethodCfgs(),
                function(i, key) {
                    // Push server methods defined in the METHODS static to the proto
                    if (!this.constructor.prototype[key] && i.localEval) {
                        this.constructor.prototype[key] = i.localEval;
                    }
                },
                this
                );
        },
        /**
         *
         * @param {Y.Wegas.persistence.Player} player
         * @returns {Y.Wegas.persistence.VariableInstance}
         */
        getInstance: function(player) {
            var key, scope;
            player = player || Wegas.Facade.Game.get('currentPlayer');
            switch (this.get('scopeType')) {
                case 'PlayerScope':
                    key = player.get('id');
                    break;
                case 'TeamScope':
                    key = player.get('team').get('id');
                    break;
                case 'GameModelScope':
                    key = 0;
                    break;
            }

            scope = Y.Wegas.Facade.Instance.cache.find('descriptorId', this.get('id'));
            return scope ? scope.variableInstances[key] : undefined;
        },
        /**
         *
         * @returns {String}
         */
        getLabel: function() {
            return I18n.t(this.get('label'));
        },
        getEditorLabel: function() {
            var trLabel = this.getLabel();
            var toDisplay;
            if (!this.get("editorTag") && !trLabel) {
                toDisplay = this.get("name");
            } else if (!this.get("editorTag")) {
                toDisplay = trLabel;
            } else if (!trLabel) {
                toDisplay = this.get("editorTag");
            } else {
                toDisplay = this.get("editorTag") + " - " + trLabel;
            }

            if (Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type") === "MODEL"
                && this.get("visibility") === "PRIVATE") {
                toDisplay = "<i class='private-in-model'>" + toDisplay + "</i>";
            }

            return toDisplay;
        },
        getIconCss: function() {
            return (
                'wegas-icon-variabledescriptor wegas-icon-' +
                this.get('@class').toLowerCase()
                );
        },
        getParent: function() {
            return Y.Wegas.Facade.Variable.cache.findParentDescriptor(this);
        }
    }, {
        ATTRS: {
            version: VERSION_ATTR_DEF,
            visibility: Wegas.persistence.Entity.ATTRS_DEF.VISIBILITY,
            isolation: {
                value: "OPEN",
                index: -3,
                view: {
                    type: SELECT,
                    layout: 'shortInline',
                    choices: [
                        {
                            value: 'OPEN',
                            label: 'None'
                        },
                        {
                            value: 'SECURED',
                            label: 'Secured'
                        },
                        {
                            value: 'HIDDEN',
                            label: 'Hidden'
                        }
                    ],
                    className: 'wegas-advanced-feature',
                    label: 'Variable isolation'
                }
            },
            comments: {
                type: ['null', STRING],
                index: 100,
                view: {
                    type: 'textarea',
                    className: 'wegas-comments',
                    borderTop: true,
                    label: 'Comments',
                }
            },
            editorTag: {
                type: NULLSTRING,
                optional: false,
                value: "",
                index: -15,
                view: {
                    label: "Tag",
                    description: "Never displayed to players"
                }
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -10,
                description: "Displayed to players",
                type: STRING
            }),
            name: {
                type: ["null", STRING],
                index: -7,
                maxWritableVisibility: PRIVATE,
                minLength: 1,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Script alias',
                    //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                    description: "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character."
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            scopeType: {
                value: "TeamScope",
                index: -6,
                view: {
                    type: SELECT,
                    layout: 'shortInline',
                    choices: [
                        {
                            value: 'PlayerScope',
                            label: 'each player'
                        },
                        {
                            value: 'TeamScope',
                            label: 'each team'
                        },
                        {
                            value: 'GameModelScope',
                            label: 'the whole game'
                        }
                    ],
                    className: 'wegas-advanced-feature',
                    label: 'One variable for'
                }
            },
            broadcastScope: {
                type: STRING,
                index: -5,
                value: "TeamScope",
                errored: function(val, formVal) {
                    var errors = [],
                        scopeType = formVal.scopeType;
                    if (scopeType === "TeamScope" && val === "PlayerScope" ||
                        scopeType === "GameModelScope" && (val === "PlayerScope" || val === "TeamScope")) {
                        errors.push('Invalid combination');
                    }
                    return errors.join(', ');
                },
                view: {
                    type: SELECT,
                    className: 'wegas-advanced-feature',
                    label: 'Variable is visible by',
                    layout: 'shortInline',
                    choices: [
                        {
                            value: 'PlayerScope',
                            label: 'the player only'
                        },
                        {
                            value: 'TeamScope',
                            label: "team members"
                        },
                        {
                            value: 'GameModelScope',
                            label: 'everybody'
                        }
                    ]
                }
            },
            defaultInstance: {
                value: {},
                validator: function(o) {
                    return o instanceof persistence.VariableInstance;
                },
                maxWritableVisibility: PROTECTED
            }
        },
        EDITMENU: {
            editBtn: {
                index: -1,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton"
                }
            },
            copyBtn: {
                index: 10,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: BUTTON,
                    label: "Duplicate",
                    plugins: [{
                            fn: "DuplicateEntityAction"
                        }]
                }
            },
            deleteBtn: {
                index: 20,
                maxVisibility: "PRIVATE", // only visible for private variables
                cfg: {
                    type: "DeleteEntityButton"
                }
            },
            exportBtn: {
                index: 30,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: BUTTON,
                    label: "Export",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: [{
                                        type: "PrintButton",
                                        label: "Html"
                                    }, {
                                        type: "PrintButton",
                                        label: "Html (Players document)",
                                        mode: "player"
                                    }, {
                                        type: "PrintButton",
                                        label: "Pdf",
                                        outputType: "pdf"
                                    }, {
                                        type: "PrintButton",
                                        label: "Pdf (Players document)",
                                        outputType: "pdf",
                                        mode: "player"
                                    }, {
                                        type: "PrintButton",
                                        label: "Pdf (proofreading document)",
                                        outputType: "pdf",
                                        mode: "reader"
                                    }, {
                                        type: "OpenEntityButton",
                                        label: "Json",
                                        url: "rest/Export/GameModel/VariableDescriptor/{id}"
                                    }]
                            }
                        }
                    ]
                }
            },
            usagesBtn: {
                index: 40,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: BUTTON,
                    label: 'Search for usages',
                    plugins: [
                        {
                            fn: 'SearchEntityAction'
                        }
                    ]
                }
            },
            resetVisibilityBtn: {
                index: 50,
                cfg: {
                    type: "BUTTON",
                    label: "Reset visibilities",
                    cssClass: "wegas-model-feature",
                    plugins: [
                        {
                            fn: "WidgetMenu",
                            cfg: {
                                children: [
                                    {
                                        type: BUTTON,
                                        label: "Model",
                                        plugins: [
                                            {
                                                fn: "ResetVisibilityAction",
                                                cfg: {
                                                    visibility: 'INTERNAL'
                                                }
                                            }
                                        ]
                                    }, {
                                        type: BUTTON,
                                        label: "Protected",
                                        plugins: [
                                            {
                                                fn: "ResetVisibilityAction",
                                                cfg: {
                                                    visibility: 'PROTECTED'
                                                }
                                            }
                                        ]
                                    }, {
                                        type: BUTTON,
                                        label: "Inherited",
                                        plugins: [
                                            {
                                                fn: "ResetVisibilityAction",
                                                cfg: {
                                                    visibility: 'INHERITED'
                                                }
                                            }
                                        ]
                                    }, {
                                        type: BUTTON,
                                        label: "Private (delete from scenario !)",
                                        plugins: [
                                            {
                                                fn: "ResetVisibilityAction",
                                                cfg: {
                                                    visibility: 'PRIVATE'
                                                }
                                            }
                                        ]
                                    }, {
                                        type: BUTTON,
                                        label: "Release from model (preserve in scenarios)",
                                        plugins: [
                                            {
                                                fn: "ReleaseVariableAction"
                                            }
                                        ]
                                    }

                                ]
                            }
                        }
                    ]
                }
            },
            findAndReplaceBtn: {
                index: 40,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: BUTTON,
                    label: 'Find & Replace',
                    cssClass: "wegas-advanced-feature",
                    plugins: [
                        {
                            fn: 'FindAndReplaceEntityAction'
                        }
                    ]
                }
            }
        }
    });
    /**
     * Scope mapper
     */
    persistence.Scope = Base.create('Scope', persistence.Entity, [], {
        getInstance: function(player) {
            Y.error(
                'SHOULD BE OVERRIDDEN, abstract!',
                new Error('getInstance, abstract'),
                'Wegas.persistance.Scope'
                );
        },
        setInstance: function(player, promise) {
            if (!this.getInstance(player)) {
                this.setPromise(player, promise);
            }
        },
        setPromise: function(player, promise) {
            Y.error(
                'SHOULD BE OVERRIDDEN, abstract!',
                new Error('setPromise, abstract'),
                'Wegas.persistance.Scope'
                );
        }
    }, {
        ATTRS: {
            variableInstances: {
                transient: true,
                getter: function(val) {
                    if (!val) {
                        return this.get('privateInstances');
                    }
                    return val;
                }
            },
            privateInstances: {
                value: {},
                transient: true
            },
            broadcastScope: {}
        }
    });
    /**
     * GameModelScope mapper
     */
    persistence.GameModelScope = Base.create('GameModelScope', persistence.Scope, [], {
        getInstance: function() {
            return this.get('variableInstances')[0];
        },
        setPromise: function(player, promise) {
            this.get('variableInstances')[0] = promise;
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'GameModelScope'
            }
        }
    });
    /**
     * TeamScope mapper
     */
    persistence.TeamScope = Base.create('TeamScope', persistence.Scope, [], {
        getInstance: function(player) {
            return this.get('variableInstances')[
                player.get('team').get('id')
            ];
        },
        setPromise: function(player, instance) {
            this.get('variableInstances')[player.get('id')] = promise;
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'TeamScope'
            }
        }
    });
    /**
     * PlayerScope mapper
     */
    persistence.PlayerScope = Base.create('PlayerScope', persistence.Scope, [], {
        getInstance: function(player) {
            return this.get('variableInstances')[player.get('id')];
        },
        setPromise: function(player, promise) {
            this.get('variableInstances')[player.get('id')] = promise;
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'PlayerScope'
            }
        }
    });
    /**
     * VariableInstance mapper
     */
    persistence.VariableInstance = Base.create("VariableInstance", persistence.Entity, [], {
        getDescriptor: function() {
            return Y.Wegas.Facade.Variable.cache.find("id", this.get("parentId"));
        }
    }, {
        ATTRS: {
            version: VERSION_ATTR_DEF,
            scopeKey: {
                type: NUMBER,
                view: {type: HIDDEN}
            }
        },
        EDITMENU: {
            editBtn: {
                index: -1,
                maxisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton"
                }
            }
        }
    });
    /**
     * Meant to augment primitive Descriptors (Number, Text, String, Boolean) with some functions
     */
    persistence.PrimitiveDescriptor = Base.create('Primitive', persistence.Entity, [], {
        getValue: function(player) {
            return this.getInstance(player).get(VALUE);
        }
    }
    );
    persistence.EnumItem = Base.create('EnumItem', persistence.Entity, [], {
        getEditorLabel: function() {
            return I18n.t(this.get("label"));
        }
    }, {
        ATTRS: {
            name: {
                type: STRING,
                index: -1,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Script alias',
                    //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                    description: "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character."
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -1,
                description: "Displayed to players",
                type: STRING
            })
        }
    });
    /**
     * StringDescriptor mapper
     */
    persistence.StringDescriptor = Base.create('StringDescriptor', persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor], {
        getLabelForAllowedValue: function(name) {
            var cats = this.get("allowedValues"),
                i;
            for (i in cats) {
                if (cats[i].get("name") === name) {
                    return I18n.t(cats[i].get("label"));
                }
            }
        },
        getIconCss: function() {
            return 'fa fa-font';
        }
    }, {
        EDITMENU: {
            convertToStaticTextBtn: {
                index: 21,
                maxVisibility: "PRIVATE", // only visible for private variables
                cfg: {
                    label: "Convert To Static Text",
                    type: "Button",
                    cssClass: "wegas-advanced-feature",
                    plugins: [{
                            fn: "ConvertToStaticTextAction"
                        }
                    ]
                }
            }
        },
        ATTRS: {
            '@class': {
                value: 'StringDescriptor'
            },
            defaultInstance: {
                valueFn: function() {
                    return {
                        trValue: {
                            translations: {}
                        }
                    };
                },
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'StringInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    trValue: Y.Wegas.Helper.getTranslationAttr({
                        label: 'Default value',
                        index: -1,
                        type: STRING
                    }),
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    }
                }
            },
            allowedValues: {
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
                            type: "string",
                            view: {type: HIDDEN}
                        },
                        name: {
                            type: STRING,
                            view: {
                                className: 'wegas-advanced-feature',
                                label: 'Script alias',
                                //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                                description: "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character."
                            }
                        },
                        label: Y.Wegas.Helper.getTranslationAttr({
                            label: "Label",
                            index: -1,
                            description: "Displayed to players",
                            type: STRING
                        })
                    }
                },
                view: {
                    label: 'Allowed Values',
                    sortable: true,
                    highlight: true
                }
            },
            maxSelectable: {
                index: 1,
                required: false,
                type: ["number", "null"],
                value: 1,
                view: {
                    "featureLevel": "DEFAULT",
                    "index": 1,
                    "label": "Maximum",
                    "layout": "shortInline"
                },
                errored: function(val, formVal) {
                    return val < 1;
                },
                visible: function(val, formVal) {
                    return formVal.allowedValues && formVal.allowedValues.length >= 1;
                }
            },
            sortable: {
                index: 2,
                type: ["boolean", "null"],
                value: false,
                view: {
                    "featureLevel": "DEFAULT",
                    "index": 2,
                    "label": "Sortable",
                    "layout": "shortInline"
                },
                visible: function(val, formVal) {
                    return formVal.allowedValues && formVal.allowedValues.length >= 1 && formVal.maxSelectable > 1;
                }
            }
        },
        METHODS: {
            setValue: {
                label: 'set',
                arguments: [
                    SELFARG,
                    Y.Wegas.Helper.getTranslationAttr({type: STRING})
                ]
            },
            getValue: {
                label: VALUE,
                returns: STRING,
                arguments: [SELFARG],
                localEval: function(player) {
                    return I18n.t(this.getInstance(player).get("trValue"));
                }
            },
            isValueSelected: {
                label: "selected value is",
                returns: BOOLEAN,
                arguments: [SELFARG, {
                        type: STRING,
                        view: {
                            type: "entityarrayfieldselect",
                            field: "allowedValues",
                            returnAttr: "name"
                        }
                    }]/*,
                     localEval: function(player, v) {
                     var value = this.getInstance(player).get(VALUE);
                     if (value && value.indexOf("[") === 0) {
                     var values = JSON.parse(value);
                     for (i in values){
                     if (values[i] === v){
                     return true;
                     }
                     }
                     }
                     return v === value;
                     }*/
            },
            countSelectedValues: {
                label: "number of selected value is",
                returns: NUMBER,
                arguments: [SELFARG]
            },
            getPositionOfValue: {
                label: "position of value, starting at 1",
                returns: NUMBER,
                arguments: [SELFARG, {
                        type: STRING,
                        view: {
                            type: "entityarrayfieldselect",
                            field: "allowedValues",
                            returnAttr: "name"
                        }
                    }]
            },
            isNotSelectedValue: {
                label: "selected value is not",
                returns: BOOLEAN,
                arguments: [SELFARG, {
                        type: STRING,
                        view: {
                            type: "entityarrayfieldselect",
                            field: "allowedValues",
                            returnAttr: "name"
                        }
                    }]
            },
            areSelectedValues: {
                label: "selected values are",
                returns: BOOLEAN,
                arguments: [SELFARG, {
                        type: ARRAY,
                        items: {
                            type: STRING,
                            view: {
                                type: "entityarrayfieldselect",
                                field: "allowedValues",
                                returnAttr: "name"
                            }
                        },
                        view: {
                            label: 'Allowed Values',
                            sortable: true,
                            highlight: true
                        }
                    }, {
                        type: "boolean",
                        value: false,
                        view: {
                            "label": "Must respect order",
                            "layout": "shortInline"
                        }
                    }]
            }
        }
    });
    /**
     * StringInstance mapper
     */
    persistence.StringInstance = Base.create('StringInstance', persistence.VariableInstance, [], {}, {
        ATTRS: {
            '@class': {
                value: 'StringInstance'
            },
            value: {
                type: "string",
                transient: true,
                getter: function() {
                    return I18n.t(this.get("trValue"));
                },
                setter: function(newVal) {
                    var newTr = {
                        "@class": "TranslatableContent",
                        translations: {
                        }
                    };
                    newTr.translations[I18n.getCode()] = newVal; // do not use one from the gameMdoel !!!
                    this.set("trValue", newTr);
                }
            },
            trValue: Y.Wegas.Helper.getTranslationAttr({
                label: "Value",
                index: -1,
                type: STRING
            }),
            selectedValue: {
                type: "string",
                transient: true,
                getter: function() {
                    var val = I18n.t(this.get("trValue"));
                    try {
                        return JSON.parse(val)[0];
                    } catch (_e) {
                    }
                    return val;
                },
                setter: function(newVal) {
                }
            },
            selectedValueLabel: {
                type: "string",
                transient: true,
                getter: function() {
                    var val = I18n.t(this.get("trValue"));
                    try {
                        return this.getDescriptor().getLabelForAllowedValue(JSON.parse(val)[0]);
                    } catch (_e) {
                    }
                    return val;
                },
                setter: function(newVal) {
                }
            }
        }
    });
    /**
     * StaticTextDescriptor mapper
     */
    persistence.StaticTextDescriptor = Base.create('StaticTextDescriptor', persistence.VariableDescriptor, [], {
        getIconCss: function() {
            return 'fa fa-paragraph';
        }
    }, {
        EDITMENU: {
            convertToTextBtn: {
                index: 21,
                maxVisibility: "PRIVATE", // only visible for private variables
                cfg: {
                    label: "Convert To Variable Text",
                    type: "Button",
                    cssClass: "wegas-advanced-feature",
                    plugins: [{
                            fn: "ConvertToTextAction"
                        }
                    ]
                }
            }
        },
        ATTRS: {
            '@class': {
                value: 'StaticTextDescriptor'
            },
            text: Y.Wegas.Helper.getTranslationAttr({
                label: "Text",
                type: HTML
            }),
            defaultInstance: {
                view: {type: HIDDEN},
                type: 'object',
                valueFn: function() {
                    return new persistence.StaticTextInstance();
                },
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'StaticTextInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    }
                }
            }
        },
        METHODS: {
        }
    }
    );
    /**
     * StaticTextInstance mapper
     */
    persistence.StaticTextInstance = Base.create('StaticTextInstance',
        persistence.VariableInstance, [], {}, {
        ATTRS: {
            '@class': {
                value: 'StaticTextInstance'
            }
        }
    });
    /**
     * TextDescriptor mapper
     */
    persistence.TextDescriptor = Base.create('TextDescriptor', persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor], {
        getIconCss: function() {
            return 'fa fa-paragraph';
        }
    }, {
        EDITMENU: {
            convertToStaticTextBtn: {
                index: 21,
                maxVisibility: "PRIVATE", // only visible for private variables
                cfg: {
                    label: "Convert To Static Text",
                    type: "Button",
                    cssClass: "wegas-advanced-feature",
                    plugins: [{
                            fn: "ConvertToStaticTextAction"
                        }
                    ]
                }
            }
        },
        ATTRS: {
            '@class': {
                value: 'TextDescriptor'
            },
            defaultInstance: {
                valueFn: function() {
                    return {
                        trValue: {
                            translations: {}
                        }
                    };
                },
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'TextInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    trValue: Y.Wegas.Helper.getTranslationAttr({
                        label: 'Default value',
                        index: -1,
                        type: HTML
                    })
                }
            }
        },
        METHODS: {
            setValue: {
                label: 'set',
                className: 'wegas-method-returnline',
                arguments: [
                    SELFARG,
                    Y.Wegas.Helper.getTranslationAttr({type: HTML})
                ]
            },
            setValueIfChanged: {
                label: 'set (if changed)',
                className: 'wegas-method-returnline wegas-advanced-features',
                arguments: [
                    SELFARG,
                    Y.Wegas.Helper.getTranslationAttr({type: HTML})
                ]
            },
            getValue: {
                label: VALUE,
                returns: STRING,
                arguments: [SELFARG],
                localEval: function(player) {
                    return I18n.t(this.getInstance(player).get("trValue"));
                }
            }
        }
    });
    /**
     * TextInstance mapper
     */
    persistence.TextInstance = Base.create('TextInstance', persistence.VariableInstance, [], {}, {
        ATTRS: {
            '@class': {
                value: 'TextInstance'
            },
            value: {
                type: "string",
                transient: true,
                getter: function() {
                    return I18n.t(this.get("trValue"));
                },
                setter: function(newVal) {
                    var newTr = {
                        "@class": "TranslatableContent",
                        translations: {
                        }
                    };
                    newTr.translations[I18n.getCode()] = newVal; // do not use one from the gameMdoel !!!
                    this.set("trValue", newTr);
                }
            },
            trValue: Y.Wegas.Helper.getTranslationAttr({
                label: "Value",
                index: -1,
                type: HTML
            })
        }
    });
    /**
     * NumberDescriptor mapper
     */
    persistence.NumberDescriptor = Base.create('NumberDescriptor', persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor], {
        getMaxValue: function() {
            return this.get('maxValue');
        },
        getMinValue: function() {
            return this.get('minValue');
        },
        getIconCss: function() {
            return 'fa wegas-icon-numberdescriptor';
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'NumberDescriptor'
            },
            minValue: {
                type: ['null', NUMBER],
                optional: true,
                errored: function(val, formVal) {
                    var errors = [],
                        max = typeof formVal.maxValue === 'number' ? formVal.maxValue : Infinity,
                        min = typeof val === 'number' ? val : -Infinity;
                    if (min > formVal.defaultInstance.value) {
                        errors.push('Minimum is greater than default value');
                    }
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
                        max = typeof val === 'number' ? val : Infinity,
                        min = typeof formVal.minValue === 'number' ? formVal.minValue : -Infinity;
                    if (max < formVal.defaultInstance.value) {
                        errors.push('Maximum is less than default value');
                    }
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
            historySize: {
                type: ['null', NUMBER],
                value: 20,
                optional: true,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Maximum history size'
                }
            },
            value: {
                transient: true,
                getter: function() {
                    if (this.getInstance()) {
                        return this.getInstance().get(VALUE);
                    } else {
                        return null;
                    }
                }
            },
            defaultValue: {
                type: STRING,
                transient: true
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'NumberInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    value: {
                        type: NUMBER,
                        required: true,
                        errored: function(val, formVal) {
                            var errors = [],
                                max = typeof formVal.maxValue === 'number' ? formVal.maxValue : Infinity,
                                min = typeof formVal.minValue === 'number' ? formVal.minValue : -Infinity;
                            if (val > max) {
                                errors.push('Default value is greater than maximum');
                            }
                            if (val < min) {
                                errors.push('Default value is less than minimum');
                            }
                            return errors.join(', ');
                        },
                        view: {
                            label: 'Default value',
                            layout: 'shortInline'
                        }
                    },
                    history: {
                        type: ARRAY,
                        view: {
                            className: 'wegas-advanced-feature',
                            label: 'History'
                        }
                    }
                }
            }
        },
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            add: {
                arguments: [
                    SELFARG,
                    {
                        type: NUMBER,
                        required: true,
                        view: {
                            layout: 'extraShortInline'
                        }
                    }
                ]
            } /*
             sub: {
             label: "subtract",
             "arguments": [{
             type: HIDDEN,
             value: SELF
             }, {
             type: NUMBER,
             required: true
             }]
             },*/,
            setValue: {
                label: 'set',
                arguments: [
                    SELFARG,
                    {
                        type: NUMBER,
                        required: true,
                        view: {layout: 'extraShortInline'}
                    }
                ]
            },
            getValue: {
                label: VALUE,
                returns: NUMBER,
                arguments: [SELFARG]
            }
        }
    });
    /**
     * NumberInstance mapper
     */
    persistence.NumberInstance = Base.create('NumberInstance', persistence.VariableInstance, [], {}, {
        ATTRS: {
            '@class': {
                value: 'NumberInstance'
            },
            value: {
                type: NUMBER,
                view: {
                    label: 'Value',
                    layout: 'shortInline'
                }
            },
            history: {
                type: ARRAY,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'History'
                }
            }
        }
    });
    /**
     * ListDescriptor mapper
     */
    persistence.ListDescriptor = Base.create('ListDescriptor', persistence.VariableDescriptor,
        [persistence.VariableContainer], {
        getChildByKey: function(key, value, directChildOnly) {
            var needle,
                filterFn = function(it) {
                    var children;
                    if (it.get(key) === value) {
                        needle = it;
                        return false;
                    } else {
                        children = it.get("items");
                        if (children) {
                            if (!directChildOnly) {
                                return Y.Array.every(children, filterFn);
                            }
                        }
                    }
                    return true;
                };
            Y.Array.every(this.get(ITEMS), filterFn);
            return needle;
        },
        getChildByTag: function(tag) {
            return this.getChildByKey('editorTag', tag, true);
        },
        getChildByName: function(name) {
            return this.getChildByKey('name', name, true);
        },
        getChildByLabel: function(label) {
            var needle,
                filterFn = function(it) {
                    if (it.get("label") instanceof Y.Wegas.persistence.TranslatableContent && I18n.t(it.get("label")) === label) {
                        needle = it;
                        return false;
                    }
                    return true;
                };
            Y.Array.every(this.get(ITEMS), filterFn);
            return needle;
        },
        find: function(id) {
            return this.getChildByKey('id', +id, false);
        },
        getTreeEditorLabel: function() {
            return '\u229e ' + this.getEditorLabel();
        },
        getIconCss: function() {
            return 'fa fa-folder';
            //return "fa fa-envelope-o";
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'ListDescriptor'
            },
            /**
             * The currently selected element based on current ListInstance.
             */
            currentItem: {
                transient: true,
                getter: function() {
                    var inst = this.getInstance();
                    if (!Y.Lang.isUndefined(inst)
                        && this.get(ITEMS)[inst.get(VALUE)]) {
                        return this.get(ITEMS)[inst.get(VALUE)];
                    } else {
                        return null;
                    }
                }
            },
            defaultInstance: {
                view: {type: HIDDEN},
                type: 'object',
                valueFn: function() {
                    return new persistence.ListInstance();
                },
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'ListInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    }
                }
            },
            allowedTypes: {
                type: ARRAY,
                view: {
                    label: 'Allowed Types',
                    // className: 'wegas-advanced-feature'
                    highlight: true
                },
                items: {
                    type: STRING,
                    required: true,
                    view: {
                        type: SELECT,
                        label: 'Type',
                        choices: AVAILABLE_TYPES
                    }
                }
            },
            addShortcut: {
                type: ['null', STRING],
                view: {
                    type: SELECT,
                    label: 'Default child type',
                    choices: OPTIONAL_AVAILABLE_TYPES
                }
            }
        },
        EDITORNAME: "Folder",
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
                                children: [
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-folder"> </span>  Folder',
                                        cssClass: 'border-bottom',
                                        targetClass: 'ListDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="wegas-icon-numberdescriptor"></span> Number',
                                        targetClass: 'NumberDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-paragraph"></span> Text',
                                        targetClass: 'TextDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-paragraph"></span> Static Text',
                                        targetClass: 'StaticTextDescriptor',
                                        cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-font"></span> String',
                                        targetClass: 'StringDescriptor'
                                            //cssClass: "wegas-advanced-feature"
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-database"></span> Object',
                                        targetClass: 'ObjectDescriptor',
                                        cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-toggle-on"></span> Boolean',
                                        targetClass: 'BooleanDescriptor',
                                        cssClass: 'border-bottom'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-question-circle"></span> Question',
                                        targetClass: 'QuestionDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-pencil-square"></span> Open question',
                                        targetClass: 'WhQuestionDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-cogs"></span> Trigger',
                                        targetClass: 'TriggerDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-sitemap fa-rotate-270"></span> State machine',
                                        targetClass: 'FSMDescriptor' /*,
                                         cfg: {
                                         states: {
                                         1: {
                                         "@class": "State"
                                         }
                                         }
                                         }*/
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-envelope"></span> Inbox',
                                        targetClass: 'InboxDescriptor'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-comments-o"></span> Dialog',
                                        targetClass: 'DialogueDescriptor' /*,
                                         cfg: {
                                         states: {
                                         1: {
                                         "@class": "DialogueState"
                                         }
                                         }
                                         }*/
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-user"></span> Resource',
                                        targetClass: 'ResourceDescriptor',
                                        cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-list"></span> Task',
                                        targetClass: 'TaskDescriptor',
                                        cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-users"></span> Peer Review',
                                        targetClass: 'PeerReviewDescriptor',
                                        cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-bar-chart"></span> Survey',
                                        targetClass: 'SurveyDescriptor'
                                            //cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-area-chart"></span> Burndown',
                                        targetClass: 'BurndownDescriptor',
                                        cssClass: 'wegas-advanced-feature'
                                    },
                                    {
                                        type: 'AddEntityChildButton',
                                        label: '<span class="fa fa-certificate"></span> Achievement',
                                        targetClass: 'AchievementDescriptor',
                                        //cssClass: 'wegas-advanced-feature'
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            sortBtn: {
                index: 2,
                cfg: {
                    type: BUTTON,
                    label: 'Sort',
                    plugins: [{
                            fn: "SortEntityAction"
                        }]
                }
            }
        }
    }
    );
    /*
     * ListInstance mapper
     */
    persistence.ListInstance = Base.create('ListInstance', persistence.VariableInstance,
        [], {}, {
        ATTRS: {
            '@class': {
                value: 'ListInstance'
            }
        }
    }
    );
    persistence.InboxDescriptor = Base.create('InboxDescriptor', persistence.VariableDescriptor, [], {
        getIconCss: function() {
            return 'fa fa-envelope';
            //return "fa fa-envelope-o";
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'InboxDescriptor'
            },
            capped: {
                value: false,
                type: BOOLEAN,
                view: {
                    label: 'Limit to one message',
                    description: 'Each new message ejects the previous one',
                    className: 'wegas-advanced-feature'
                }
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'InboxInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    }
                }
            }
        },
        METHODS: {
            /*sendMessage: {
             label: "send message",
             className: "wegas-method-sendmessage",
             "arguments": [{
             type: HIDDEN,
             value: SELF
             }, {
             type: STRING,
             label: "From",
             scriptType: STRING
             }, {
             type: STRING,
             label: "Subject",
             scriptType: STRING,
             required: true
             }, {
             type: HTML,
             label: "Body",
             scriptType: STRING,
             required: true
             }, {
             type: "list",
             label: "",
             scriptType: STRING,
             elementType: {
             type: "wegasurl",
             label: "",
             required: true
             }
             }]
             },
             sendDatedMessage: {
             label: "send dated message",
             className: "wegas-method-sendmessage",
             "arguments": [{
             type: HIDDEN,
             value: SELF
             }, {
             type: STRING,
             label: "From",
             scriptType: STRING
             }, {
             type: STRING,
             label: "Date",
             scriptType: STRING
             }, {
             type: STRING,
             label: "Subject",
             scriptType: STRING,
             required: true
             }, {
             type: HTML,
             label: "Body",
             scriptType: STRING,
             required: true
             }, {
             type: "list",
             label: "",
             scriptType: STRING,
             elementType: {
             type: "wegasurl",
             label: "",
             required: true
             }
             }]
             },*/
            sendMessage: {
                label: 'send message',
                className: 'wegas-method-sendmessage',
                arguments: [
                    SELFARG,
                    Y.Wegas.Helper.getTranslationAttr({
                        type: STRING, label: "From" //required + layout: 'short'
                    }),
                    Y.Wegas.Helper.getTranslationAttr({
                        type: STRING, label: "Date" //required + layout: 'short'
                    }),
                    Y.Wegas.Helper.getTranslationAttr({
                        type: STRING, label: "Subject" //required + layout: 'short'
                    }),
                    Y.Wegas.Helper.getTranslationAttr({
                        type: HTML, label: "Body"
                    }),
                    {
                        type: STRING,
                        value: "", // prevent undefined as Java will interprets such a value as a literat "undefined" !
                        view: {
                            label: 'Token',
                            description: 'Message identifier used to reference the message within FSM/Trigger conditions'
                        }
                    },
                    {
                        type: 'array',
                        value: [],
                        view: {label: 'Attachments'},
                        preProcessAST: function(argDesc, value, tools) {
                            if (value && value.type === 'ArrayExpression') {
                                for (var i in value.elements) {
                                    var item = value.elements[i];
                                    if (item && item.type === 'Literal') {
                                        var o =
                                            {
                                                "@class": "Attachment",
                                                "file": {
                                                    "@class": "TranslatableContent",
                                                    "translations": {
                                                    }
                                                }
                                            };
                                        o.file.translations[I18n.getCode()] = {
                                            translation: item.value,
                                            status: ""
                                        };
                                        value.elements[i] = tools.valueToAST(o, argDesc.items);
                                    }
                                }
                            }
                            return value;
                        },
                        items: {
                            type: "object",
                            properties: {
                                id: IDATTRDEF,
                                "@class": {
                                    type: STRING,
                                    value: "Attachment",
                                    view: {type: HIDDEN}
                                },
                                file: Y.Wegas.Helper.getTranslationAttr({
                                    type: "wegasurl", label: "File"
                                })
                            }
                        }
                    }
                ]
            },
            isEmpty: {
                label: 'is empty',
                returns: BOOLEAN,
                arguments: [SELFARG],
                localEval: function(player) {
                    return (
                        this.getInstance(player).get('messages').length < 1
                        );
                }
            },
            isTokenMarkedAsRead: {
                label: 'is token marked as read',
                returns: BOOLEAN,
                arguments: [
                    SELFARG,
                    {
                        type: STRING
                    }
                ]
            }
        }
    }
    );
    /**
     * InboxInstance mapper
     */
    persistence.InboxInstance = Base.create('InboxInstance', persistence.VariableInstance, [], {}, {
        ATTRS: {
            '@class': {
                value: 'InboxInstance'
            },
            messages: {
                type: ARRAY,
                setter: function(v) {
                    v.sort(function(a, b) {
                        // newer first
                        return b.get('time') - a.get('time');
                    });
                    return v;
                },
                transient: true,
                value: []
            },
            unreadCount: {
                type: NUMBER,
                transient: true,
                value: 0
            }
        }
    });
    /**
     * Message mapper
     */
    persistence.Attachment = Base.create('Attachment', persistence.Entity, [], {}, {
        ATTRS: {
            '@class': {
                value: 'Attachment'
            },
            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
            file: Y.Wegas.Helper.getTranslationAttr({
                label: "File",
                type: "wegasurl"
            })
        }
    });
    /**
     * Message mapper
     */
    persistence.Message = Base.create('Message', persistence.Entity, [], {}, {
        ATTRS: {
            '@class': {
                value: 'Message'
            },
            from: Y.Wegas.Helper.getTranslationAttr({
                label: "From",
                type: STRING
            }),
            subject: Y.Wegas.Helper.getTranslationAttr({
                label: "Subject",
                type: STRING
            }),
            body: Y.Wegas.Helper.getTranslationAttr({
                label: "Subject",
                type: HTML
            }),
            date: Y.Wegas.Helper.getTranslationAttr({
                label: "Subject",
                type: STRING
            }),
            unread: {
                value: false,
                type: BOOLEAN
            },
            token: {},
            time: {
                transient: true
            },
            attachments: {}
        }
    });
    /**
     * Script mapper
     */
    persistence.Script = Base.create('Script', persistence.Entity, [], {
        initializer: function() {
            this.publish('evaluated');
            this._inProgress = false;
        },
        /*
         * Conditional script to test. Error resolve to true
         * @returns {Promise}
         */
        localEval: function() {
            return new Y.Promise(
                Y.bind(function(resolve) {
                    if (this.get('content') === '') {
                        // empty scripts resolve to true
                        resolve(true);
                        return;
                    }
                    if (Wegas.Facade.Variable.script['eval']) {
                        if (!this._inProgress) {
                            this._inProgress = true;
                            Wegas.Facade.Variable.script['eval'](
                                this.get('content'),
                                {
                                    on: {
                                        success: Y.bind(function(data) {
                                            if (
                                                data.response.entity ===
                                                true
                                                ) {
                                                resolve(true);
                                            } else {
                                                resolve(false);
                                            }
                                            this._inProgress = false;
                                        }, this),
                                        failure: Y.bind(function() {
                                            resolve(false);
                                            this._inProgress = false;
                                        }, this)
                                    }
                                }
                            );
                        } else {
                            Y.log('evaluation in progress');
                        }
                    }
                }, this)
                );
        },
        isEmpty: function() {
            return this.content === null || this.content === '';
        }
    }, {
        ATTRS: {
            id: {
                value: undefined, // An Embeddable has no ID !!! Forcing it
                readOnly: true,
                transient: true
            },
            '@class': {
                value: 'Script'
            },
            content: {
                type: STRING,
                format: TEXT,
                view: {
                    label: 'content'
                },
                setter: function(v) {
                    this._result = null;
                    return v;
                }
            }
        }
    });
    /**
     *
     */
    persistence.PageMeta = Base.create('wegas-pagemeta', persistence.Entity, [], {}, {
        EDITORNAME: 'Page properties',
        ATTRS: {
            id: {
                type: STRING,
                setter: function(val) {
                    // override setter from Entity
                    return val;
                },
                view: {
                    label: "Id",
                    readOnly: true
                }
            },
            name: {
                type: STRING,
                optional: true,
                view: {label: "Name"}
            },
            trainerPage: {
                type: ["null", BOOLEAN],
                required: false,
                view: {label: "Show in dashboard"}
            },
            scenaristPage: {
                type: ["null", BOOLEAN],
                required: false,
                view: {label: "Show in editor"}
            }
        }
    });

    persistence.PageFolderMeta = Base.create('wegas-pagefoldermeta', persistence.Entity, [], {},
        {
            EDITORNAME: 'Page Folder properties',
            ATTRS: {
                id: {
                    type: STRING,
                    setter: function(val) {
                        // override setter from Entity
                        return val;
                    },
                    id: {view: {type: 'hidden'}},
                },
                path: {view: {type: 'hidden'}},
                name: {
                    type: STRING,
                    optional: true,
                    view: {label: "Name"}
                }
            }
        }
    );
    /**
     * BooleanDescriptor mapper
     */
    persistence.BooleanDescriptor = Base.create('BooleanDescriptor', persistence.VariableDescriptor,
        [persistence.PrimitiveDescriptor], {
        getIconCss: function() {
            return 'fa fa-toggle-on';
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'BooleanDescriptor'
            },
            value: {
                transient: true,
                getter: function() {
                    if (this.getInstance()) {
                        return this.getInstance().get(VALUE);
                    } else {
                        return null;
                    }
                }
            },
            defaultValue: {
                type: BOOLEAN,
                value: false,
                transient: true
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'BooleanInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    value: {
                        type: BOOLEAN,
                        view: {
                            label: 'Default value'
                        }
                    }
                }
            }
        },
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            setValue: {
                label: 'set',
                arguments: [
                    SELFARG,
                    {
                        type: BOOLEAN,
                        value: true,
                        required: true
                    }
                ]
            },
            getValue: {
                label: "is true",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isFalse: {
                label: "is false",
                returns: BOOLEAN,
                arguments: [SELFARG]
            }
        }
    }
    );
    /**
     * BooleanInstance mapper
     */
    persistence.BooleanInstance = Base.create('BooleanInstance', persistence.VariableInstance, [],
        {}, {
        ATTRS: {
            '@class': {
                value: 'BooleanInstance'
            },
            value: {
                type: BOOLEAN
            }
        }
    });

    /**
     * AchievementDescriptor mapper
     */
    persistence.AchievementDescriptor = Base.create('AchievementDescriptor',
        persistence.VariableDescriptor, [], {
        getIconCss: function() {
            return 'fa fa-certificate';
        }
    }, {
        ATTRS: {
            '@class': {
                value: 'AchievementDescriptor'
            },
            quest: {
                type: STRING,
                minLength: 1,
                view: {
                    label: 'Quest',
                    type: 'questselect'
                }
            },
            weight: {
                type: NUMBER,
                value: 1,
                errored: function(val, formVal) {
                    var errors = [];
                    if (val <= 0) {
                        errors.push('Value must be greater than 0');
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Weight',
                    layout: 'shortInline'
                }
            },
            message: Y.Wegas.Helper.getTranslationAttr({
                label: "Message",
                type: STRING
            }),
            color: {
                type: STRING,
                minLength: 1,
                value: 'black',
                view: {
                    label: 'Color',
                    type: 'colorpicker'
                }
            },
            icon: {
                type: STRING,
                value: '',
                view: {
                    label: 'Icon'
                }
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'AchievementInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    achieved: {
                        type: BOOLEAN,
                        view: {
                            className: 'wegas-advanced-feature',
                            label: 'achieved'
                        }
                    }
                }
            }
        },
        /**
         * Defines methods available in wysiwyg script editor
         */
        METHODS: {
            setAchieved: {
                label: 'set',
                arguments: [
                    SELFARG,
                    {
                        type: BOOLEAN,
                        value: true,
                        required: true
                    }
                ]
            },
            isAchieved: {
                label: "has been achieved",
                returns: BOOLEAN,
                arguments: [SELFARG]
            }
        }
    }
    );
    /**
     * AchievementInstance mapper
     */
    persistence.AchievementInstance = Base.create('AchievementInstance', persistence.VariableInstance, [],
        {}, {
        ATTRS: {
            '@class': {
                value: 'AchievementInstance'
            },
            achieved: {
                type: BOOLEAN,
                view: {
                    label: 'Achived',
                    layout: 'shortInline'
                }
            }
        }
    });

});
