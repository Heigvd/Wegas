/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-entity', function (Y) {
    "use strict";
    /**
    * Entity is used to represent db objects.
    */
    var Entity = function (cfg) {
        Y.mix(this, cfg);
    };

    Y.mix(Entity.prototype, {
        writeObject: function () {
            return Y.mix({}, this);                                             // Return a copy of this's fields.
        },
        /**
         * Cleaning out JSON export, "compression" purpose.
         * This methid is called by JSON's stringify method
         *
         * @return {Entity} containing relevant informations needed by server
         */
        toJSON: function(){
            var e = this.writeObject();                                         //Make a working copy
            for(var i in e){                                                    //Removing irrelevant informations
                if(e[i] === null){                                              //Null attributes
                    //TODO : empty strings, objects ??
                    delete e[i];
                }
            }
            e["@class"] = this["@class"];                                       //Adding the @class attribute to JSON's stringify method
            return e;
        }
    });
    Y.mix(Entity, {
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
                    if (!Y.Lang.isArray(value) && !Y.Lang.isUndefined(value["@class"])) {
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

            if (o["@class"].indexOf("Descriptor") !== -1) {                     // @Hack so VariableDescriptors are instantiated even if they dont have a mapping
                classDef = Y.Wegas.persistence.VariableDescriptor;
            }
            if (o["@class"].indexOf("Instance") !== -1) {                       // @Hack so VariableInstances are instantiated even if they dont have a mapping
                classDef = Y.Wegas.persistence.VariableInstance;
            }

            classDef = Y.Wegas.persistence[o["@class"]] || classDef;
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
     * GameScope mapper
     */
    Y.Wegas.persistence.GameScope = function() {
        Y.Wegas.persistence.GameScope.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.GameScope, Y.Wegas.persistence.Entity, {
        "@class": "GameScope",
        getInstance: function (){
            try{
                return this.variableInstances[0];
            }catch(e){
                return null;
            }
        }
    });

    /**
     * TeamScope mapper
     */
    Y.Wegas.persistence.TeamScope = function() {
        Y.Wegas.persistence.TeamScope.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.TeamScope, Y.Wegas.persistence.Entity, {
        "@class": "TeamScope",
        getInstance: function(){
            try{
                return this.variableInstances[Y.Wegas.app.get('currentTeam')];
            }catch(e){
                return null;
            }
        }
    });

    /**
     * PlayerScope mapper
     */
    Y.Wegas.persistence.PlayerScope = function() {
        Y.Wegas.persistence.PlayerScope.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.PlayerScope, Y.Wegas.persistence.Entity, {
        "@class": "PlayerScope",
        getInstance: function () {
            try{
                return this.variableInstances[Y.Wegas.app.get('currentPlayer')];
            }catch(e){
                return null;
            }
        }
    });

    /**
     * GameModelScope mapper
     */
    Y.Wegas.persistence.GameModelScope = function() {
        Y.Wegas.persistence.GameModelScope.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.GameModelScope, Y.Wegas.persistence.Entity, {
        "@class": "GameModelScope",
        getInstance: function () {
            try{
                return this.variableInstances[0];
            }catch(e){
                return null;
            }
        }
    });
    /**
    * VariableDescriptor mapper
    */
    Y.Wegas.persistence.VariableDescriptor = function() {
        Y.Wegas.persistence.VariableDescriptor.superclass.constructor.apply(this, arguments);
        Y.mix(this,{
            id: null,
            name: null,
            defaultVariableInstance:null,
            scope: new Y.Wegas.persistence.TeamScope()                          //Default to teamscope
        });
    }
    Y.extend(Y.Wegas.persistence.VariableDescriptor, Y.Wegas.persistence.Entity, {
        getInstance: function () {
            return this.scope.getInstance();
        }
    });

    /**
    * VariableInstance mapper
    */
    Y.Wegas.persistence.VariableInstance = function() {
        Y.Wegas.persistence.VariableInstance.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.VariableInstance, Y.Wegas.persistence.Entity);

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