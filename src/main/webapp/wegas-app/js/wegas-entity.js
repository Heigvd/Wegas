/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-entity', function (Y) {
    "use strict";
    /**
     * Entity is used to represent db objects.
     */

    var Entity = Y.Base.create("Entity", Y.Base, [ ], {

        initializer: function () {
        },
        /**
         * Serialize the object to a json object.
         *
         * @function writeObject
         */
        writeObject: function () {
            return Y.mix({}, this);                                             // Return a copy of this's fields.
        },
        /**
         * Returns the form configuration associated to this object, to be used a an inputex object.
         */
        getFormCfg: function () {
            var forms = Y.Wegas.app.get('forms');
            return this.forms[this['@class']] || forms[this.type] ||            // Select first server defined forms, based on the @class or the type attribute
            this.EDITFORM || [];                                            // And if no form is defined we return the default one defined in the entity
        }
    },{
        ATTRS: {
            id: {},
            '@class': {}
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
                    if (!Y.Lang.isArray(value) /*&& !Y.Lang.isUndefined(value["@class"])*/) {
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
                classDef = Y.Wegas.persistence[o["@class"]] || classDef;
            }
            return new classDef(o);
        },
        writeObject: function (o) {
            return o.writeObject();
        }
    });


    Y.namespace('Wegas').persistence = {
        Entity : Entity
    };

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
    Y.Wegas.persistence.GameModel = Y.Base.create("GameModel", Y.Wegas.persistence.Entity, [], {
        ATTRS: {
            name: {}
        },

        EDITFORM : [{
            name: 'id',
            type: 'hidden'
        }, {
            name: 'name',
            label:'Name',
            required: true
        }, {
            name: '@class',
            value:'GameModel',
            type: 'hidden'
        }]
    });

    /**
     * Game mapper
     */
    Y.Wegas.persistence.Game = Y.Base.create("Game", Y.Wegas.persistence.Entity, [], {
        EDITFORM : [{
            name: 'id',
            type: 'hidden'
        }, {
            name: 'name',
            label:'Name',
            required: true
        }, {
            name: 'token',
            label:'Token',
            required: true
        }, {
            name: '@class',
            value:'Game',
            type: 'hidden'
        }]
    });


    /**
     * Team mapper
     */
    Y.Wegas.persistence.Team = Y.Base.create("Team", Y.Wegas.persistence.Entity, [], {
        EDITFORM : [{
            name: 'id',
            type: 'hidden'
        }, {
            name: 'gameId',
            type: 'hidden'
        }, {
            name: '@class',
            value:'Team',
            type: 'hidden'
        }, {
            name: 'name',
            label:'Name',
            required: true
        }]
    });

    /**
     * Player mapper
     */
    Y.Wegas.persistence.Player = Y.Base.create("Player", Y.Wegas.persistence.Entity, [], {
        EDITFORM : [{
            name: 'id',
            type: 'hidden'
        }, {
            name: 'teamId',
            type: 'hidden'
        }, {
            name: 'name',
            label:'Name',
            required: true
        }, {
            name: '@class',
            value:'Player',
            type: 'hidden'
        }]
    });

    /**
     * User mapper
     */
    Y.Wegas.persistence.User = Y.Base.create("User", Y.Wegas.persistence.Entity, [], {
        EDITFORM : [{
            name: 'id',
            type: 'hidden'
        }, {
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
        }, {
            name: '@class',
            value:'User',
            type: 'hidden'
        }]
    });
    /**
     * VariableDescriptor mapper
     */

    Y.Wegas.persistence.VariableDescriptor = Y.Base.create("VariableDescriptor", Y.Wegas.persistence.Entity, [], {
        getInstance: function () {
            switch (this.scope['@class']) {
                case 'PlayerScope':
                    return this.scope.variableInstances[Y.Wegas.app.get('currentPlayer')];
                case 'TeamScope':
                    return this.scope.variableInstances[Y.Wegas.app.get('currentTeam')];
                case 'GameModelScope':
                case 'GameScope':
                    return this.scope.variableInstances[0];
            }
            return null;
        }
    }, {
        ATTRS: {
            name: {},
            descriptorId: {},
            defaultVariableInstance: {},
            scope: {}
        }
    });

    /**
     * VariableInstance mapper
     */
    Y.Wegas.persistence.VariableInstance = Y.Base.create("VariableInstance", Y.Wegas.persistence.Entity, [], {
        });

    /**
     * Script mapper
     */
    Y.Wegas.persistence.Script = function() {
        Y.Wegas.persistence.Script.superclass.constructor.apply(this, arguments);

        Y.mix(this, {
            content:null,
            language: "JavaScript"
        });
    }
    Y.extend(Y.Wegas.persistence.Script, Y.Wegas.persistence.Entity, {
        "@class": "Script",
        isValid: function (){
        //TODO : FX a greffer :)
        },
        isEmpty: function () {
            return (this.content == null || this.content == "");
        }
    });

});