/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-entity', function (Y) {
    "use strict";

    var IDATTRDEF = {
        type: "string",
        _inputex: {
            _type: "hidden"
        }
    };
    /**
     *  Add custom attributes to be used in ATTR param in static cfg.
     */
    //Y.Base._ATTR_CFG =
    Y.Base._ATTR_CFG.push("type", "properties", "_inputex");
    Y.Base._ATTR_CFG_HASH = Y.Array.hash(Y.Base._ATTR_CFG);

    /**
     * Entity is used to represent db objects.
     */
    Y.namespace('Wegas.persistence').Entity = Y.Base.create("Entity", Y.Base, [], {

        /**
         * Serialize to a json object.
         *
         * @function getObject
         */
        toJSON: function () {
            var k, ret = this.getAttrs();
            delete ret["initialized"];                                          // Remove values coming from Y.Base implementation
            delete ret["destroyed"];

            for (k in ret) {
                if (ret.hasOwnProperty(k) && ret[k] instanceof Y.Wegas.persistence.Entity) {
                    ret[k] = ret[k].toJSON();
                }
            }
            return ret;                                                         // Return a copy of this's fields.
        },
        /**
         * Cleaning out object by removing irrelevant informations such as null values
         *
         * @return {Entity} containing relevant informations needed by server
         */
        compressExport: function(){
            var e = this.getAttrs();
            delete e["initialized"];
            delete e["destroyed"];
            for(var i in e){                                                    //Removing irrelevant informations
                if(e[i] === null){                                              //Null attributes
                    //TODO : empty strings, objects ??
                    delete e[i];
                }
                if(e.hasOwnProperty(i) && e[i] instanceof Y.Wegas.persistence.Entity){
                    e[i] = e[i].compressExport()
                }
            }
            return e;
        },
        /**
         * Returns the form configuration associated to this object, to be used a an inputex object.
         */
        getFormCfg: function () {
            var forms = Y.Wegas.app.get('editorForms'),
            form = forms[this.get('@class')] || forms[this.get("type")]         // Select first server defined forms, based on the @class or the type attribute
            //||  this.constructor.EDITFORM                                     // And if no form is defined we return the default one defined in the entity
            ;

            if (!form) {                                                        // If no edit form could be found, we generate one based on the ATTRS parameter.
                var schemaMap, attrCfgs = this.getAttrCfgs();
                delete attrCfgs["initialized"];                                 // Remove values coming from Y.Base implementation
                delete attrCfgs["destroyed"];

                schemaMap = {
                    Entity: {
                        id:'Entity',
                        type:'object',
                        properties: attrCfgs
                    }
                };

                var builder = new Y.inputEx.JsonSchema.Builder({
                    'schemaIdentifierMap': schemaMap,
                    'defaultOptions':{
                        'showMsg':true
                    }
                });
                form = builder.schemaToInputEx(schemaMap.Entity).fields;
            }
            return form || [];
        },

        /**
         * Returns the edition menu associated to this object, to be used a an inputex object.
         */
        getMenuCfg: function () {
            var menus = Y.Wegas.app.get('editorMenus'),
            menu = menus[this.get('@class')] || menus[this.get("type")] ||      // Select first server defined forms, based on the @class or the type attribute
            this.constructor.EDITMENU || [];                                    // And if no form is defined we return the default one defined in the entity

            return menu;
        },

        /**
         *  Helper function that walks the class hierarchy and returns it's attributes
         *  cfg (ATTRS), used in Y.Wegas.Entity.getFormCfg().
         */
        getAttrCfgs : function() {
            var c = this.constructor, attrs = [];

            while (c) {
                if (c.ATTRS) {                                                  // Add to attributes
                    attrs[attrs.length] = c.ATTRS;
                }
                c = c.superclass ? c.superclass.constructor : null;
            }
            return this._aggregateAttrs(attrs);
        }
    }, {
        ATTRS: {
            id: {
                writeOnce: "initOnly",
                type:'string',
                _inputex: {
                    _type: 'hidden'
                }
            },
            '@class': {
                value: "null",
                readOnly: true,
                type: 'string',
                _inputex: {
                    _type: 'hidden'
                }
            }
        },

        /**
         *  This method takes a parsed json object and instantiate them based
         *  on their @class attribute. Target class are found in namespace
         *  Y.Wegas.Data.
         */
        revive: function (data) {
            var walk = function (o,key) {
                var k,v,value = o[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            v = walk(value, k);
                            if (v === undefined) {
                                //delete value[k];
                            } else {
                                value[k] = v;
                            }
                        }
                    }
                    if (!Y.Lang.isArray(value) && (!Y.Lang.isUndefined(value["@class"])/* || !Y.Lang.isUndefined(value["type"])*/)) {
                        return Y.Wegas.persistence.Entity.readObject(value);
                    }
                }
                return value;                                                   // If no value was returned before, return raw original object
            };

            //return typeof reviver === 'function' ? walk({'':data},'') : data;
            return walk({
                '':data
            },'');
        },
        readObject: function (o) {
            var classDef = Y.Wegas.persistence.Entity;

            if (o["@class"] && o["@class"].indexOf("Descriptor") !== -1) {                     // @Hack so VariableDescriptors are instantiated even if they dont have a mapping
                classDef = Y.Wegas.persistence.VariableDescriptor;
            }
            if (o["@class"] && o["@class"].indexOf("Instance") !== -1) {                       // @Hack so VariableInstances are instantiated even if they dont have a mapping
                classDef = Y.Wegas.persistence.VariableInstance;
            }
            if (o["@class"] && Y.Wegas.persistence[o["@class"]]) {
                // console.log(o["@class"] );
                classDef = Y.Wegas.persistence[o["@class"]] || classDef;
            }
            return new classDef(o);
        }
    });

    /**
     * ServerResponse mapper
     */
    Y.Wegas.persistence["ManagedModeResponseFilter$ServerResponse"] = Y.Base.create("ManagedModeResponseFilter$ServerResponse", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            entities: {
                value: []
            },
            events: {
                value: []
            }
        }
    });
    Y.Wegas.persistence.EntityUpdatedEvent = Y.Base.create("EntityUpdatedEvent", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            updatedEntities: {
                value: []
            }
        }
    });

    /**
     * GameModel mapper
     */
    Y.Wegas.persistence.GameModel = Y.Base.create("GameModel", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                _inputex: {
                    label:'Name'
                }
            },
            games: {
                type: "array",
                value: []
            },
            scriptLibrary: {
                value: {}
            }
        }
    });

    /**
     * Game mapper
     */
    Y.Wegas.persistence.Game = Y.Base.create("Game", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                _inputex: {
                    label:'Name'
                }
            },
            token: {
                type: "string",
                _inputex: {
                    label:'Token'
                }
            },
            teams: {
                value: [],
                type: "array"
            }
        },
        EDITMENU: [{
                text: "New team",
                value: {
                    op:'addChild',
                    childClass: "Team"
                }
            }, {
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });

    /**
     * Team mapper
     */
    Y.Wegas.persistence.Team = Y.Base.create("Team", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                _inputex: {
                    label: "Name"
                }
            },
            players: {
                type: "array",
                value: []
            },
            gameId: {
                type: "string",
                _inputex: {
                    _type: "hidden"
                }
            }
        },
        EDITMENU: [{
                text: "New player",
                value: {
                    op:'addChild',
                    childClass: "Player"
                }
            }, {
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });

    /**
     * Player mapper
     */
    Y.Wegas.persistence.Player = Y.Base.create("Player", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                _inputex: {
                    label: "Name"
                }
            },
            teamId: {
                type: "string",
                _inputex: {
                    _type: "hidden"
                }
            }
        },
        EDITMENU: [{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });

    /**
     * User mapper
     */
    Y.Wegas.persistence.User = Y.Base.create("User", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string",
                _inputex: {
                    label: "Name"
                }
            },
            password: {
                type: "string"
            }
        },
        EDITFORM : [{
                name: 'name',
                label:'Name',
                required: true
            }, {
                name: 'password',
                type: 'password',
                label: 'New password',
                showMsg: true,
                id: 'firstPassword',
                strengthIndicator: true,
                capsLockWarning: true
            }, {
                type: 'password',
                label: 'Confirmation',
                showMsg: true,
                confirm: 'firstPassword'
            }]
    });
    /**
     * VariableDescriptor mapper
     */
    Y.Wegas.persistence.VariableDescriptor = Y.Base.create("VariableDescriptor", Y.Wegas.persistence.Entity, [], {
        getInstance: function () {
            return this.get("scope").getInstance();
        }
    }, {
        ATTRS: {
            name: {
                value:null,
                validator:function(s){
                    return s === null || Y.Lang.isString(s);
                },
                type: "string",
                _inputex: {
                    label:'Name'
                }
            },
            label: {
                type: "string",
                _inputex: {
                    label:'Label',
                    required: false
                }
            },
            scope: {
                valueFn: function(){
                    return new Y.Wegas.persistence.TeamScope();                 // Should the default scope be set server or client side?
                },
                validator:function(o){
                    return o instanceof Y.Wegas.persistence.Scope;
                },
                type: "object",
                properties: {
                    "@class": {
                        type: "string",
                        choices: [{
                                value: "TeamScope",
                                label: 'different for each team'
                            }, {
                                value: "PlayerScope",
                                label: 'different for each user'
                            }, {
                                value: "GameModelScope",
                                label: 'the same for everybody'
                            }],
                        _inputex: {
                            label: 'Variable is'
                        }
                    }
                }
            },
            defaultVariableInstance: {
                value:null,
                validator: function(o){
                    return o instanceof Y.Wegas.persistence.VariableInstance;
                }
            }
        }
        //        EDITFORM:  [{
        //            name: 'valueselector',
        //            label:'Variable is',
        //            type: 'keyvalue',
        //            availableFields: []
        //        }]
    });



    /**
     * Scope mapper
     */
    Y.Wegas.persistence.Scope = Y.Base.create("Scope", Y.Wegas.persistence.Entity, [], {
        getInstance: function (){
            console.error("SHOULD BE OVERRIDDEN")
        }
    }, {
        ATTRS: {
            variableInstances: {}
        }
    });
    /**
     * GameModelScope mapper
     */
    Y.Wegas.persistence.GameModelScope = Y.Base.create("GameModelScope", Y.Wegas.persistence.Scope, [], {
        getInstance: function () {
            return this.get("variableInstances")[0];
        }
    },{
        ATTRS:{
            "@class":{
                value:"GameModelScope"
            }
        }
    });
    /**
     * GameScope mapper
     */
    Y.Wegas.persistence.GameScope = Y.Base.create("GameScope", Y.Wegas.persistence.Scope, [], {
        getInstance: function (){
            return this.get("variableInstances")[0];
        }
    },{
        ATTRS:{
            "@class":{
                value:"GameScope"
            }
        }
    });

    /**
     * TeamScope mapper
     */
    Y.Wegas.persistence.TeamScope = Y.Base.create("TeamScope", Y.Wegas.persistence.Scope, [], {
        getInstance: function (){
            return this.get("variableInstances")[Y.Wegas.app.get('currentTeam')];
        }
    },{
        ATTRS:{
            "@class":{
                value:"TeamScope"
            }
        }
    });

    /**
     * PlayerScope mapper
     */
    Y.Wegas.persistence.PlayerScope = Y.Base.create("PlayerScope", Y.Wegas.persistence.Scope, [], {
        getInstance: function () {
            return this.get("variableInstances")[Y.Wegas.app.get('currentPlayer')];
        }
    },{
        ATTRS:{
            "@class":{
                value:"PlayerScope"
            }
        }
    });

    /**
     * VariableInstance mapper
     */
    Y.Wegas.persistence.VariableInstance = Y.Base.create("VariableInstance", Y.Wegas.persistence.Entity, [], { }, {
        ATTRS: {
            value: {
                type: "string"
            }
        }
    });
    /**
     * StringDescriptor mapper
     */
    Y.Wegas.persistence.StringDescriptor = Y.Base.create("StringDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"StringDescriptor"
            },
            defaultVariableInstance: {
                properties: {
                    "@class": {
                        type: "string",
                        _inputex: {
                            value:'StringInstance',
                            _type: 'hidden'
                        }
                    },
                    id: {
                        type: "string",
                        _inputex: {
                            _type: 'hidden'
                        }
                    },
                    value: {
                        type: "string",
                        _inputex: {
                            label: 'Default value'
                        }
                    }

                }
            }
        },
        EDITMENU: [{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });
    /**
     * StringInstance mapper
     */
    Y.Wegas.persistence.StringInstance = Y.Base.create("StringInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS:{
            "@class":{
                value:"StringInstance"
            },
            value: {
                type: "string",
                _inputex: {
                    label: 'Text'

                }
            }
        }
    });
    /**
     * NumberDescriptor mapper
     */
    Y.Wegas.persistence.NumberDescriptor = Y.Base.create("NumberDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"NumberDescriptor"
            },
            minValue: {
                type: "string",
                _inputex: {
                    label:'Minimum'
                }
            },
            maxValue: {
                type: "string",
                _inputex: {
                    label:'Maximum'
                }
            },
            defaultVariableInstance: {
                properties: {
                    "@class": {
                        type: "string",
                        _inputex: {
                            value:'NumberInstance',
                            _type: 'hidden'
                        }
                    },
                    id: {
                        type: "string",
                        _inputex: {
                            _type: 'hidden'
                        }
                    },
                    value: {
                        type: "string",
                        _inputex: {
                            label: 'Default value',
                            regexp: /^[0-9]*$/
                        }
                    }

                }
            }
        },
        EDITMENU: [{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });
    /**
     * NumberInstance mapper
     */
    Y.Wegas.persistence.NumberInstance = Y.Base.create("NumberInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS:{
            "@class":{
                value:"NumberInstance"
            },
            value: {
                type: "string",
                _inputex: {
                    label: 'Text',
                    regexp: /^[0-9]*$/
                }
            }
        }
    });
    /**
     * ListDescriptor mapper
     */
    Y.Wegas.persistence.ListDescriptor = Y.Base.create("ListDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"ListDescriptor"
            },
            items: {
                value: []
            },
            defaultVariableInstance: {
                properties: {
                    "@class": {
                        type: "string",
                        _inputex: {
                            value:'ListInstance',
                            _type: "hidden"
                        }
                    },
                    "id": IDATTRDEF
                }
            }
        },
        EDITMENU: [{
                text: "Add element",
                value: {
                    op:'addChild',
                    childClass: "VariableDescriptor"
                }
            },{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });
    /*
     * ListInstance mapper
     */
    Y.Wegas.persistence.ListInstance = Y.Base.create("ListInstance", Y.Wegas.persistence.VariableInstance, [], {},{
        ATTRS:{
            "@class":{
                value:"ListInstance"
            }
        }
    });


    /**
     * QuestionDescriptor mapper
     */
    Y.Wegas.persistence.QuestionDescriptor = Y.Base.create("QuestionDescriptor", Y.Wegas.persistence.ListDescriptor, [], {}, {
        ATTRS:{
            "@class":{
                type: "string",
                value:"QuestionDescriptor"
            },
            allowMultipleReplies: {
                value: false,
                type: 'boolean',
                _inputex: {
                    label: 'Allow multiple replies'
                }
            },
            defaultVariableInstance: {
                properties: {
                    "@class": {
                        type: "string",
                        _inputex: {
                            _type: "hidden",
                            value: "QuestionInstance"
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: "boolean",
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    }
                }
            },
            description: {
                type: "string",
                _inputex: {
                    _type: "html",
                    label:'Description',
                    opts: {
                        height: '80px'
                    }
                }
            }
        },
        EDITMENU: [{
                text: "Add a choice",
                value: {
                    op:'addChild',
                    childClass: "ChoiceDescriptor"
                }
            }, {
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });

    /**
     * QuestionInstance mapper
     */
    Y.Wegas.persistence.QuestionInstance = Y.Base.create("QuestionInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class":{
                value:"QuestionInstance"
            },
            active: {
                value: true,
                type: 'boolean'
            },
            unread: {
                value: true,
                type: 'boolean'
            },
            replies: {
                value: [],
                type: "array"
            }
        }
    });
    /**
     * ChoiceDescriptor mapper
     */
    Y.Wegas.persistence.ChoiceDescriptor = Y.Base.create("ChoiceDescriptor", Y.Wegas.persistence.ListDescriptor, [], {}, {
        ATTRS:{
            "@class":{
                value:"ChoiceDescriptor"
            },
            duration: {
                value: 1,
                type: "string"
            },
            cost: {

                value: 1
            },
            defaultVariableInstance: {
                properties: {
                    '@class': {
                        type: "string",
                        _inputex: {
                            _type: 'hidden',
                            value:'ChoiceInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: "boolean",
                        _inputex: {
                            label:'Active by default',
                            value: true
                        }
                    }

                }
            },
            description: {
                type: 'string',
                _inputex: {
                    label:'Description',
                    _type: 'html',
                    opts: {
                        height: '50px'
                    }
                }
            },
            feedback: {
                type: 'string',
                _inputex: {
                    label:'Feedback',
                    _type: 'html',
                    opts: {
                        height: '50px'
                    }
                }
            },
            impact: {
                properties: {
                    '@class': {
                        type: 'string',
                        _inputex: {
                            value:'Script',
                            _type: 'hidden'
                        }
                    },
                    language: {
                        type: 'string',
                        _inputex: {
                            value:'JavaScript',
                            _type: 'hidden'
                        }
                    },
                    content: {
                        type: 'string',
                        _inputex: {
                            _type: 'text',
                            label:'Impact',
                            rows: 3
                        }
                    }
                }
            }
        }
    });

    /**
     * ChoiceInstance mapper
     */
    Y.Wegas.persistence.ChoiceInstance = Y.Base.create("ChoiceInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class":{
                value:"ChoiceInstance"
            },
            active: {
                value: true,
                type: "boolean",
                _inputex: {
                    label:'Active'
                }
            }
        }
    });

    /**
     * ResourceDescriptor mapper
     */
    Y.Wegas.persistence.ResourceDescriptor = Y.Base.create("ResourceDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"ResourceDescriptor"
            },
            description: {
                type: "string",
                _inputex: {
                    _type: 'html',
                    label:'Description',
                    opts: {
                        height: '80px'
                    }
                }
            },
            defaultVariableInstance: {
                properties: {
                    '@class': {
                        type: "string",
                        _inputex: {
                            _type: 'hidden',
                            value:'ResourceInstance'
                        }
                    },
                    id: {
                        type: "string",
                        name: 'id',
                        _inputex: {
                            _type: 'hidden'
                        }
                    },
                    active: {
                        type: 'boolean',
                        _inputex: {
                            label: "Active by default",
                            value: true
                        }
                    },
                    moral: {
                        type: "string",
                        _inputex: {
                            label: "Moral"
                        }
                    },
                    confidence: {
                        name: "confidence",
                        type: "string",
                        _inputex: {
                            label: "Confiance"
                        }
                    },
                    properties: {
                        _inputex: {
                            _type: "object",
                            label: "Default properties"
                        }
                    },
                    skillset: {
                        _inputex: {
                            _type: "object",
                            label: "Default skills"
                        }
                    }
                }
            }
        },
        EDITMENU: [{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });

    /**
     * ResourceInstance mapper
     */
    Y.Wegas.persistence.ResourceInstance = Y.Base.create("ResourceInstance", Y.Wegas.persistence.VariableInstance, [], { }, {
        ATTRS:{
            "@class":{
                value:"ResourceInstance"
            },
            active: {
                type: "boolean"
            },
            moral: {
                type: "string"
            },
            confidence: {
                type: "string"
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: "object"
                }
            },
            skillset: {
                name: "skillset",
                _inputex: {
                    label: "Skills",
                    _type: "object"
                }
            }
        }
    });

    /**
     * TaskDescriptor mapper
     */
    Y.Wegas.persistence.TaskDescriptor = Y.Base.create("TaskDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS:{
            "@class":{
                value:"TaskDescriptor"
            },
            defaultVariableInstance: {
                properties: {
                    '@class': {
                        type: 'string',
                        _inputex: {
                            _type: 'hidden',
                            value:'TaskInstance'
                        }
                    },
                    id: {
                        type: 'string',
                        _inputex: {
                            _type: 'hidden'
                        }
                    },
                    active: {
                        type: 'boolean',
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    },
                    duration: {
                        type: "string"
                    },
                    properties: {
                        _inputex: {
                            label: "Default properties",
                            _type: "object"
                        }
                    },
                    skillset: {
                        _inputex: {
                            label: "Default skillset",
                            _type: "object"
                        }
                    }
                }
            },
            description: {
                type: 'string',
                _inputex: {
                    _type: 'html',
                    label:'Description',
                    opts: {
                        height: '80px'
                    }
                }
            }
        },
        EDITMENU: [{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });

    /**
     * TaskInstance mapper
     */
    Y.Wegas.persistence.TaskInstance = Y.Base.create("TaskInstance", Y.Wegas.persistence.VariableInstance, [], { }, {
        ATTRS:{
            "@class":{
                value:"TaskInstance"
            },
            active: {
                type: 'boolean'
            },
            duration: {
                type: "string"
            },
            properties: {
                _inputex: {
                    label: "Properties",
                    _type: "object"
                }
            },
            skillset: {
                _inputex: {
                    label: "Skillset",
                    _type: "object"
                }
            }
        }
    });

    Y.Wegas.persistence.InboxDescriptor = Y.Base.create("", Y.Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS:{
            "@class":{
                value:"InboxDescriptor"
            }
        },
        EDITMENU: [{
                text: "Delete",
                value: {
                    op:'delete'
                }
            }]
    });
    /**
     * InboxInstance mapper
     */
    Y.Wegas.persistence.InboxInstance = Y.Base.create("InboxInstance", Y.Wegas.persistence.VariableInstance, [], { }, {
        ATTRS: {
            "@class":{
                value:"InboxInstance"
            },
            messages: {
                value: []
            }
        }
    });

    /**
     * Message mapper
     */
    Y.Wegas.persistence.Message = Y.Base.create("Message", Y.Wegas.persistence.Entity, [], { }, {
        ATTRS: {
            "@class":{
                value:"Message"
            },
            subject: {},
            body: {},
            unread : {
                value: false,
                type: "boolean"
            }
        }
    });

    /**
     * Script mapper
     */
    Y.Wegas.persistence.Script = Y.Base.create("Script", Y.Wegas.persistence.Entity, [], {
        isValid: function (){
            //TODO : FX a greffer :)
        },
        isEmpty: function () {
            return (this.content == null || this.content == "");
        }
    }, {
        ATTRS: {
            "@class":{
                value:"Script",
                type: "string"
            },
            language: {
                value: "JavaScript",
                type: "string",
                choices:[{
                        value:"JavaScript"
                    }],
                _inputex: {
                    //type:"select",
                    type:"hidden"
                }
            },
            content: {
                type: "string",
                _inputex: {
                    _type: "text"
                }
            }
        }
    });


    /*
     * We set the Y.Wegas.persistence.VariableDescriptor.EDITFORM values here, so
     * we can use other object's existing declaration.
     */
    //    Y.Wegas.persistence.VariableDescriptor.EDITFORM[0].availableFields = [
    //    {
    //        type: 'group',
    //        name: 'StringDescriptor',
    //        label: 'a string',
    //        fields: Y.Wegas.persistence.StringDescriptor.EDITFORM
    //    },
    //
    //    {
    //        type: 'group',
    //        name: 'NumberDescriptor',
    //        label: 'a number',
    //        fields:  Y.Wegas.persistence.NumberDescriptor.EDITFORM
    //    },
    //    {
    //        type: 'group',
    //        name: 'QuestionDescriptor',
    //        label: 'a question',
    //        fields: Y.Wegas.persistence.QuestionDescriptor.EDITFORM
    //    },
    //    {
    //        type: 'group',
    //        name: 'ListDescriptor',
    //        label: 'a list',
    //        fields:  Y.Wegas.persistence.ListDescriptor.EDITFORM
    //    },
    //    {
    //        type: 'group',
    //        name: 'ResourceDescriptor',
    //        label: 'a resource',
    //        fields:  Y.Wegas.persistence.ResourceDescriptor.EDITFORM
    //    },
    //    {
    //        type: 'group',
    //        name: 'TaskDescriptor',
    //        label: 'a task',
    //        fields:  Y.Wegas.persistence.TaskDescriptor.EDITFORM
    //    },
    //    // {type: 'group', name: 'DialogueDescriptor', label: 'a dialogue',fields:  Y.Wegas.persistence.DialogueDescriptor.EDITFORM }
    //    // {type: 'group', name: 'TriggerDescriptor', label: 'a trigger', fields:  Y.Wegas.persistence.TriggerDescriptor.EDITFORM },
    //    ];
});
