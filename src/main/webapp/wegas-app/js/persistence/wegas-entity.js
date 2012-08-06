/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-entity', function (Y) {
    "use strict";

    var IDATTRDEF = {
        type: "string",
        optional: true,                                                         // The id is optional for entites that have not been persisted
        _inputex: {
            _type: "hidden"
        }
    }, Entity;
    /**
     *  Add custom attributes to be used in ATTR param in static cfg.
     */
    Y.Base._ATTR_CFG.push("type", "properties", "_inputex", "optional", "format", "choices", "items", "enum", "default", "transient");
    Y.Base._ATTR_CFG_HASH = Y.Array.hash(Y.Base._ATTR_CFG);

    /**
     * Entity is used to represent db objects.
     */
    Entity = Y.Base.create("Entity", Y.Base, [], {

        // *** Lifecycle methods *** //

        initializer: function(cfg) {
            Entity.ENTITIES_HASH[this.name] = false;
        },

        /**
         * Serialize to a json object.
         *
         * @method toJSON
         * @return {object}
         */
        toJSON: function () {
            var k, ret = this.getAttrs(),
            attrCfgs = this.getAttrCfgs();

            for (k in ret) {
                if (ret.hasOwnProperty(k) && ret[k] instanceof Y.Wegas.persistence.Entity) {
                    ret[k] = ret[k].toJSON();
                }

                if (attrCfgs[k]["transient"]) {                                 // Remove any transient attribute
                    delete ret[k];
                }
            }
            return ret;                                                         // Return a copy of this's fields.
        },
        /**
         * Create a new JSON Object from this entity, filtered out by mask
         * @method JSONclone
         * @param {Array} mask or {String}* a list of params
         * @return {Object} a filtered out clone
         */
        JSONclone: function(mask){
            var k, i, e = JSON.parse(JSON.stringify(this));
            mask = Y.Lang.isArray(mask) ? mask : Array.prototype.slice.call(arguments);
            return Y.clone(e, true, function(value, key, output, input){
                if(mask.indexOf(key) != -1){
                    return false;
                }else{
                    return true;
                }
            });

        },
        /**
         * Create a new Entity from this entity
         *
         * @method clone
         * @return {Entity} a usable clone
         */
        clone: function (){
            return Entity.revive(this.JSONclone(["id","variableInstances"]));
        },
        /**
         * Returns the form configuration associated to this object, to be used a an inputex object.
         */
        getFormCfg: function () {
            var i, form, forms;

            // forms = Y.Wegas.app.get('editorForms'),                          // Select first server defined forms, based on the @class or the type attribute
            // form = forms[this.get('@class')] || forms[this.get("type")]
            form = form ||  this.constructor.EDITFORM;                          // And if no form is defined we check if there is a default one defined in the entity

            if (!form) {                                                        // If no edit form could be found, we generate one based on the ATTRS parameter.
                var schemaMap, attrCfgs = this.getAttrCfgs();

                for (i in attrCfgs) {
                    attrCfgs[i]["default"] = attrCfgs[i].value;                 // Use the value as default (useful form json object serialization)

                    if ( attrCfgs[i]["transient"] ) {
                        delete attrCfgs[i];
                    }
                }

                schemaMap = {
                    Entity: {
                        properties: attrCfgs
                    }
                };

                var builder = new Y.inputEx.JsonSchema.Builder({
                    'schemaIdentifierMap': schemaMap,
                    'defaultOptions':{
                        'showMsg':true
                    }
                });
                form = builder.schemaToInputEx(schemaMap.Entity);
            }
            return form || [];
        },

        /**
         * Returns the edition menu associated to this object, to be used a an inputex object.
         */
        getMenuCfg: function ( data ) {
            var i, menus = Y.Wegas.app.get('editorMenus'),
            //    staticMenus =
            menu = menus[this.get('@class')] || menus[this.get("type")] ||      // Select first server defined forms, based on the @class or the type attribute
            this.getStatic("EDITMENU")[0] || [];                                // And if no form is defined we return the default one defined in the entity

            for (i = 0; i < menu.length; i += 1 ) {                             // Attach self and the provided datasource to the menu items, to allow them to know which entity to update
                menu[i].data = menu[i].data || {};
                menu[i].data.entity = this;
                Y.mix( menu[i].data, data );
            }
            return menu;
        },

        /**
         *  Helper function that walks the class hierarchy and returns it's attributes
         *  cfg (ATTRS), used in Y.Wegas.Entity.getFormCfg().
         */
        getAttrCfgs : function() {
            return this._aggregateAttrs(this.getStatic("ATTRS"));
        },
        getStatic: function(key) {
            var c = this.constructor, ret = [];

            while (c) {
                if (c[key]) {                                                  // Add to attributes
                    ret[ret.length] = c[key];
                }
                c = c.superclass ? c.superclass.constructor : null;
            }
            return ret;
        }
    }, {
        _buildCfg: {
            //statics: ["EDITMENU"],
            custom: {
                HASH: function (prop, Receiver, Supplier) {

                    Entity.ENTITIES_HASH[Receiver.name] = true

                //var c = Supplier.constructor;
                //while (!Receiver.EDITMENU && c) {
                //    if (c.EDITMENU) {                                                  // Add to attributes
                //        Receiver.EDITMENU = c.EDITMENU
                //    }
                //    c = c.superclass ? c.superclass.constructor : null;
                //}
                }
            }
        },
        ATTRS: {
            initialized: {
                "transient": true
            },
            destroyed: {
                "transient": true
            },
            id: Y.mix(IDATTRDEF, {
                writeOnce: "initOnly",
                setter: function ( val ) {
                    return val * 1;
                }
            }),
            '@class': {
                value: "null",
                writeOnce: "initOnly",
                type: 'string',
                _inputex: {
                    _type: 'hidden'
                }
            }
        },

        EDITMENU: [],

        /**
         * Holds a reference to all declared entity classes
         */
        ENTITIES_HASH: {},

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

            if (o["@class"] && Y.Wegas.persistence[o["@class"]]) {
                // console.log(o["@class"] );
                classDef = Y.Wegas.persistence[o["@class"]];
            }else{
                if (o["@class"] && o["@class"].indexOf("Descriptor") !== -1) {                     // @Hack so VariableDescriptors are instantiated even if they dont have a mapping
                    classDef = Y.Wegas.persistence.VariableDescriptor;
                }
                if (o["@class"] && o["@class"].indexOf("Instance") !== -1) {                       // @Hack so VariableInstances are instantiated even if they dont have a mapping
                    classDef = Y.Wegas.persistence.VariableInstance;
                }
            }
            return new classDef(o);
        }
    });
    Y.namespace('Wegas.persistence').Entity = Entity;

    /**
     * ServerResponse mapper
     */
    Y.Wegas.persistence["ManagedModeResponseFilter$ServerResponse"] = Y.Base.create("ManagedModeResponseFilter$ServerResponse", Entity, [], {}, {
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
                type: "string"
            },
            games: {
                type: "array",
                value: [],
                _inputex: {
                    _type:'hidden'
                }
            },
            widgetsUri: {
                type: "string",
                choices: [{
                    value:"wegas-leaderway/db/wegas-leaderway-pages.json",
                    label:"Leaderway"
                }, {
                    value:"wegas-crimesim/db/wegas-leaderway-crimesim.json",
                    label:"Crimesim"
                }, {
                    value:"wegas-mmo/db/wegas-leaderway-mmo.json",
                    label:"Programming Game"
                }],
                _inputex: {
                    label: "Layout"
                }
            },
            cssUri: {
                type: "string",
                _inputex: {
                    label: "CSS Stylesheet"
                }
            },
            scriptLibrary:{
                value:{},
                _inputex: {
                    _type: "hidden"
                }
            }
        },
        EDITMENU: [{
            type: "Button",
            label: "Explore",
            plugins: [{
                fn: "LoadTreeviewNodeAction",
                cfg: {
                    tabId: "gamesTreeViewTab"
                }
            }]
        },
        //        {
        //            type: "Button",
        //            label: "Open in editor",
        //            plugins: [{
        //                fn: "OpenGameAction"
        //            }]
        //        },
        //         {
        //            type: "AddEntityChildButton",
        //            label: "Add game",
        //            childClass: "Game"
        //        },
        //{
        //                    "type": "NewEntityButton",
        //                    "label": "<span class=\"wegas-icon wegas-icon-new\"></span>New game model",
        //                    "targetClass": "GameModel"
        //                }
        {
            type: "EditEntityButton",
            label: "Properties"
        }, {
            type: "DeleteEntityButton"
        }]
    });

    /**
     * Game mapper
     */
    Y.Wegas.persistence.Game = Y.Base.create("Game", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string"
            },
            token: {
                type: "string"
            },
            teams: {
                type: "array",
                value: [],
                _inputex: {
                    _type: "hidden"
                }
            }
        },
        EDITMENU: [{
            type: "AddEntityChildButton",
            label: "Add team",
            childClass: "Team"
        }, {
            type: "EditEntityButton",
            label: "Properties"
        }, {
            type: "DeleteEntityButton"
        }]
    });

    /**
     * Team mapper
     */
    Y.Wegas.persistence.Team = Y.Base.create("Team", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            '@class': {
                value: "Team"
            },
            name: {
                type: "string"
            },
            token: {
                type: "string"
            },
            players: {
                value: [],
                _inputex: {
                    _type: "hidden"
                }
            },
            gameId: IDATTRDEF
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Properties"
        },{
            type: "Button",
            label: "Add player",
            plugins: [{
                fn: "AddEntityChildAction",
                cfg: {
                    childClass: "Player"
                }
            }]
        }, {
            type: "DeleteEntityButton"
        }]
    });

    /**
     * Player mapper
     */
    Y.Wegas.persistence.Player = Y.Base.create("Player", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string"
            },
            teamId: IDATTRDEF
        },
        EDITMENU: [{
            type: "EditEntityButton",
            label: "Properties"
        },{
            type: "DeleteEntityButton"
        }]
    });

    /**
     * User mapper
     */
    Y.Wegas.persistence.User = Y.Base.create("User", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {
                type: "string"
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
        getInstance: function ( playerId ) {
            playerId = playerId || Y.Wegas.app.get('currentPlayer');
            return this.get("scope").getInstance( playerId );
        },
        clone: function(){
            var e = Y.Wegas.persistence.VariableDescriptor.superclass.clone.call(this);
            e.set("name", e.get("name") + "_copy");
            return e;
        }
    }, {
        ATTRS: {
            name: {
                value:null,
                validator:function(s){
                    return s === null || Y.Lang.isString(s);
                },
                type: "string"
            },
            label: {
                type: "string",
                optional: true
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
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: "DeleteEntityButton"
        }],
        EDITFORM:  {
            name: 'valueselector',
            label:'Variable is',
            type: 'keyvalue',
            availableFields: []
        }
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
        getInstance: function ( playerId ){
            return this.get("variableInstances")[ Y.Wegas.app.get('currentTeam') ];
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
        getInstance: function ( playerId ) {
            return this.get("variableInstances")[playerId];
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
    Y.Wegas.persistence.VariableInstance = Y.Base.create("VariableInstance", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            descriptorId: {
                type: "string"
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }]
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
                    id: IDATTRDEF,
                    value: {
                        type: "string",
                        _inputex: {
                            label: 'Default value'
                        }
                    }

                }
            }
        }
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
                type: "string"
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
                optional: true,
                _inputex: {
                    label:'Minimum'
                }
            },
            maxValue: {
                type: "string",
                optional: true,
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
                    id: IDATTRDEF,
                    value: {
                        type: "string",
                        _inputex: {
                            label: 'Default value',
                            regexp: /^[0-9]*$/
                        }
                    }

                }
            }
        }
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
                type: "array",
                value: [],
                "transient": true,
                _inputex: {
                    _type: "hidden"
                }
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
                    id: IDATTRDEF
                }
            }
        },
        EDITMENU: [ {
            type: "EditEntityButton"
        }, {
            type: "AddEntityChildButton",
            label: "Add child",
            childClass: "VariableDescriptor"
        }, {
            type: "DeleteEntityButton"
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
     * ResourceDescriptor mapper
     */
    Y.Wegas.persistence.ResourceDescriptor = Y.Base.create("ResourceDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"ResourceDescriptor"
            },
            description: {
                type: "string",
                format: 'html'
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
                    id: IDATTRDEF,
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
                    moralHistory: {
                        type: "array"
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
        }
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
            moralHistory: {
                type: "array"
            },
            confidenceHistory: {
                type: "array"
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
            },
            assignments: {
                type: "array",
                value: []
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
                    id: IDATTRDEF,
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
                format: 'html'
            }
        }
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

    /**
     * Assignement mapper
     */
    Y.Wegas.persistence.Assignment = Y.Base.create("Assignment", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS:{
            "@class":{
                value:"TaskInstance"
            },
            taskDescriptorId: {
                type: 'string'
            }
        }
    });

    Y.Wegas.persistence.InboxDescriptor = Y.Base.create("", Y.Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS:{
            "@class":{
                value:"InboxDescriptor"
            }
        }
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
            },
            from: {}
        }
    });

    /**
     * Script mapper
     */
    Y.Wegas.persistence.Script = Y.Base.create("Script", Y.Wegas.persistence.Entity, [], {
        isValid: function (){
        //TODO : FX a greffer :)
        },
        localEval: function(){
            try{
                return Y.Wegas.VariableDescriptorFacade.script.scopedEval(this.get("content"));
            }catch(e){
                console.error("SCRIPT plugin failed");
                return null;
            }
        },
        isEmpty: function () {
            return (this.content == null || this.content == "");
        }
    }, {
        ATTRS: {
            id: {
                value:undefined,                                                // An Embeddable has no ID !!! Forcing it
                readOnly:true,
                "transient": true
            },
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
                format: "text"
            }
        }
    });


    /*
     * We set the Y.Wegas.persistence.VariableDescriptor.EDITFORM values here, so
     * we can use other object's existing declaration.
     */
    Y.Wegas.persistence.VariableDescriptor.EDITFORM.availableFields = [
    Y.mix({
        name: 'NumberDescriptor',
        label: 'a number'
    }, new Y.Wegas.persistence.NumberDescriptor().getFormCfg()),
    Y.mix({
        name: 'StringDescriptor',
        label: 'a string'
    }, new Y.Wegas.persistence.StringDescriptor().getFormCfg()),
    Y.mix({
        name: 'ListDescriptor',
        label: 'a list'
    }, new Y.Wegas.persistence.ListDescriptor().getFormCfg()),
    Y.mix({
        name: 'ResourceDescriptor',
        label: 'a number'
    }, new Y.Wegas.persistence.ResourceDescriptor().getFormCfg()),
    Y.mix({
        name: 'TaskDescriptor',
        label: 'a task'
    }, new Y.Wegas.persistence.TaskDescriptor().getFormCfg())
    ];
});
