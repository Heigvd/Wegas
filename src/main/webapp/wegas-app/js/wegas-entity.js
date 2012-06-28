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
    * VariableDescriptor mapper
    */
    Y.Wegas.persistence.VariableDescriptor = function() {
        Y.Wegas.persistence.VariableDescriptor.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.VariableDescriptor, Y.Wegas.persistence.Entity, {
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
    });
    
    /**
    * VariableInstance mapper
    */
    Y.Wegas.persistence.VariableInstance = function() {
        Y.Wegas.persistence.VariableInstance.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.VariableInstance, Y.Wegas.persistence.Entity);
});