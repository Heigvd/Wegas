/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-entity', function (Y) {
    "use strict";

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
            form = forms[this.get('@class')] || forms[this.get("type")] ||      // Select first server defined forms, based on the @class or the type attribute
            this.constructor.EDITFORM || [];                                    // And if no form is defined we return the default one defined in the entity

            return form.concat([{
                name: 'id',
                type: 'hidden'
            }, {
                name: '@class',
                type: 'hidden'
            }]);
        },

        /**
         * Returns the edition menu associated to this object, to be used a an inputex object.
         */
        getMenuCfg: function () {
            var menus = Y.Wegas.app.get('editorMenus'),
            menu = menus[this.get('@class')] || menus[this.get("type")] ||      // Select first server defined forms, based on the @class or the type attribute
            this.constructor.EDITMENU || [];                                // And if no form is defined we return the default one defined in the entity

            return menu;
        }
    }, {
        ATTRS: {
            id: {
                writeOnce: "initOnly"
            },
            '@class': {
                value: null,
                readOnly: true
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
    /**
     * GameModel mapper
     */
    Y.Wegas.persistence.GameModel = Y.Base.create("GameModel", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {},
            games: {
                value: []
            },
            scriptLibrary: {
                value: {}
            }
        },
        EDITFORM : [{
            name: 'name',
            label:'Name',
            required: true
        }]
    });

    /**
     * Game mapper
     */
    Y.Wegas.persistence.Game = Y.Base.create("Game", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            name: {},
            teams: {
                value: []
            }
        },
        EDITFORM: [{
            name: 'name',
            label:'Name',
            required: true
        }, {
            name: 'token',
            label:'Token',
            required: true
        }],
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
            name: {},
            players: {
                value: []
            }
        },
        EDITFORM : [{
            name: 'gameId',
            type: 'hidden'
        }, {
            name: 'name',
            label:'Name',
            required: true
        }],
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
        EDITFORM : [{
            name: 'teamId',
            type: 'hidden'
        }, {
            name: 'name',
            label:'Name',
            required: true
        }],
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
        getFormCfg: function () {
            var def =  [{
                name: 'name',
                label:'Name',
                required: true
            }, {
                name: 'label',
                label:'Label'
            }, {
                name: 'scope',
                type:'group',
                fields: [{
                    type: 'select',
                    name: '@class',
                    label: 'Variable is',
                    choices: [{
                        value: "TeamScope",
                        label: 'different for each team'
                    }, {
                        value: "PlayerScope",
                        label: 'different for each user'
                    }, {
                        value: "GameModelScope",
                        label: 'the same for everybody'
                    }]
                }]
            }];

            return def.concat(Y.Wegas.persistence.VariableDescriptor.superclass.getFormCfg.apply(this));
        },
        getInstance: function () {
            return this.get("scope").getInstance();
        }
    }, {
        ATTRS: {
            name: {
                value:null,
                validator:function(s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            descriptorId: {},
            defaultVariableInstance: {
                value:null,
                validator: function(o){
                    return o instanceof Y.Wegas.persistence.VariableInstance;
                }
            },
            scope: {
                valueFn: function(){
                    return new Y.Wegas.persistence.TeamScope();                 // Should the default scope be set server or client side?
                },
                validator:function(o){
                    return o instanceof Y.Wegas.persistence.Scope;
                }
            }
        },
        EDITFORM:  [{
            name: 'valueselector',
            label:'Variable is',
            type: 'keyvalue',
            availableFields: []
        }]
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
            value: {}
        }
    });
    /**
     * StringDescriptor mapper
     */
    Y.Wegas.persistence.StringDescriptor = Y.Base.create("StringDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"StringDescriptor"
            }
        },
        EDITFORM:  [{
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'StringInstance',
                type: 'hidden'
            },{
                name: 'id',
                type: 'hidden'
            },{
                name: 'value',
                label: 'Default value'
            }]
        }],
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
            }
        },
        EDITFORM: [{
            name: 'value',
            label: 'Text'
        }]
    });
    /**
     * NumberDescriptor mapper
     */
    Y.Wegas.persistence.NumberDescriptor = Y.Base.create("NumberDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"NumberDescriptor"
            },
            minValue: {},
            maxValue: {}
        },
        EDITFORM: [{
            name: 'minValue',
            label:'Minimum'
        }, {
            name: 'maxValue',
            label: "Maximum"
        },{
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'NumberInstance',
                type: 'hidden'
            },{
                name: 'id',
                type: 'hidden'
            },{
                name: 'value',
                label: 'Default value',
                regexp: /^[0-9]*$/
            }]
        }],
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
            }
        },
        EDITFORM: [{
            name: 'value',
            label: 'Text',
            regexp: /^[0-9]*$/
        }]
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
            }
        },
        EDITFORM: [{
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'ListInstance',
                type: 'hidden'
            },{
                name: 'id',
                type: 'hidden'
            }]
        }],
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
                value:"QuestionDescriptor"
            }
        },
        EDITFORM: [{
            name: 'label',
            label:'Label'
        }, {
            name: 'allowMultipleReplies',
            'label': 'Allow multiple replies',
            type: 'boolean',
            value: false
        }, {
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'QuestionInstance',
                type: 'hidden'
            }, {
                name: 'id',
                type: 'hidden'
            }, {
                name: 'active',
                'label': 'Active by default',
                type: 'boolean',
                value: true
            }]
        }, {
            name: 'description',
            'type': 'html',
            label:'Description',
            opts: {
                "width":"100%",
                height: '80px'
            }
        }],
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
                value: true
            },
            unread: {
                value: true
            },
            replies: {
                value: []
            }
        },
        EDITFORM: [{
            name: 'active',
            label: 'Active',
            type: 'boolean'
        },{
            name: 'unread',
            label: 'Unread',
            type: 'boolean'
        }]
    });
    /**
     * ChoiceDescriptor mapper
     */
    Y.Wegas.persistence.ChoiceDescriptor = Y.Base.create("ChoiceDescriptor", Y.Wegas.persistence.ListDescriptor, [], {}, {
        ATTRS:{
            "@class":{
                value:"ChoiceDescriptor"
            }
        },
        EDITFORM: [{
            name: 'description',
            'type': 'html',
            label:'Description',
            opts: {
                width:'100%',
                height: '50px'
            }
        }, {
            name: 'feedback',
            type: 'html',
            label:'Feedback',
            opts: {
                height: '50px'
            }
        },{
            name:'impact',
            type:'group',
            fields: [{
                name: '@class',
                value:'Script',
                type: 'hidden'
            }, {
                name: 'language',
                value:'JavaScript',
                type: 'hidden'
            }, {
                name: 'content',
                'type': 'text',
                label:'Impact',
                rows: 3
            }]
        }, {
            name: 'duration',
            label:'Duration',
            required: true,
            value: 1
        }, {
            name: 'cost',
            label:'Cost',
            required: true,
            value: 1
        }, {
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'ChoiceInstance',
                type: 'hidden'
            }, {
                name: 'id',
                type: 'hidden'
            }, {
                name: 'active',
                label:'Active by default',
                type: 'boolean',
                value: true
            }]
        }]
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
                value: true
            }
        },
        EDITMENU: [{
            name: 'active',
            label:'Active',
            type: 'boolean'
        }]
    });

    /**
     * ResourceDescriptor mapper
     */
    Y.Wegas.persistence.ResourceDescriptor = Y.Base.create("ResourceDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS: {
            "@class":{
                value:"ResourceDescriptor"
            },
            messages: {}
        },
        EDITFORM: [{
            name: 'description',
            'type': 'html',
            label:'Description',
            opts: {
                "width":"100%",
                height: '80px'
            }
        }, {
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'ResourceInstance',
                type: 'hidden'
            }, {
                name: 'id',
                type: 'hidden'
            }, {
                name: 'active',
                'label': 'Active by default',
                type: 'boolean',
                value: true
            }, {
                name: "moral",
                label: "Moral",
                required: true
            }, {
                name: "confidence",
                label: "Confiance",
                required: true
            }, {
                name: "properties",
                "type": "object",
                label: "Default properties"
            }, {
                name: "skillset",
                "type": "object",
                label: "Default skills"
            }]
        }],
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
            }
        },
        EDITFORM: [{
            name: 'active',
            label:'Active',
            type: 'boolean'
        }, {
            name: "moral",
            label: "Moral",
            required: true
        }, {
            name: "confidence",
            label: "Confiance",
            required: true
        }, {
            name: "properties",
            "type": "object",
            label: "Properties"
        }, {
            name: "skillset",
            "type": "object",
            label: "Skills"
        }]
    });

    /**
     * TaskDescriptor mapper
     */
    Y.Wegas.persistence.TaskDescriptor = Y.Base.create("TaskDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS:{
            "@class":{
                value:"TaskDescriptor"
            }
        },
        EDITFORM: [{
            name: 'description',
            'type': 'html',
            label:'Description',
            opts: {
                "width":"100%",
                height: '80px'
            }
        }, {
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'TaskInstance',
                type: 'hidden'
            }, {
                name: 'id',
                type: 'hidden'
            }, {
                name: 'active',
                'label': 'Active by default',
                type: 'boolean',
                value: true
            }, {
                name: 'duration',
                label:'Duration',
                required: true
            }, {
                name: "properties",
                "type": "object",
                label: "Default properties"
            }, {
                name: "skillset",
                "type": "object",
                label: "Default skillset"
            }]
        }],
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
            }
        },
        EDITFORM: [{
            name: 'active',
            label:'Active',
            type: 'boolean'
        }, {
            name: 'duration',
            label:'Duration',
            required: true
        }, {
            name: "properties",
            "type": "object",
            label: "Properties"
        }, {
            name: "skillset",
            "type": "object",
            label: "Skillset"
        }]
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
            messages: {}
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
            body: {}
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
            content: {},
            language: {
                value: "JavaScript"
            },
            "@class":{
                value:"Script"
            }
        }
    });


    /*
     * We set the Y.Wegas.persistence.VariableDescriptor.EDITFORMS values here, so
     * we can use other object's existing declaration.
     */
//    Y.Wegas.persistence.VariableDescriptor.EDITFORMS
//    [
//                            {type: 'group', name: 'StringDescriptor', label: 'a string',fields: Config.forms.StringDescriptor},
//                            {type: 'group', name: 'NumberDescriptor', label: 'a number',fields:  Config.forms.NumberDescriptor },
//                            {type: 'group', name: 'QuestionDescriptor', label: 'a question', fields: Config.forms.QuestionDescriptor },
//                            {type: 'group', name: 'ListDescriptor', label: 'a list',fields:  Config.forms.ListDescriptor },
//                            {type: 'group', name: 'TriggerDescriptor', label: 'a trigger',fields:  Config.forms.TriggerDescriptor },
//                            {type: 'group', name: 'ResourceDescriptor', label: 'a resource',fields:  Config.forms.ResourceDescriptor },
//                            {type: 'group', name: 'TaskDescriptor', label: 'a task',fields:  Config.forms.TaskDescriptor },
//                            {type: 'group', name: 'DialogueDescriptor', label: 'a dialogue',fields:  Config.forms.DialogueDescriptor }
//                        ]
//                    }
//                ]
});
