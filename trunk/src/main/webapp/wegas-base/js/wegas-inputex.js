/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inputex', function(Y) {
    varYAHOO = Y.YUI2;
    
    Y.inputEx.Group.prototype.getFieldById = function(id) {
        for (var i=0;i<this.inputs.length;i++) {
            if (this.inputs[i].options.id && this.inputs[i].options.id == id) {
                return this.inputs[i];
            }
        }
        return null;
    };
    Y.inputEx.Group.prototype.runAction = function(action, triggerValue) {
        var field;
        if (action.name) field = this.getFieldByName(action.name);
        else if (action.id) field = this.getFieldById(action.id);
        if( Y.Lang.isFunction(field[action.action]) ) {
            field[action.action].call(field);
        }
        else if( Y.Lang.isFunction(action.action) ) {
            action.action.call(field, triggerValue);
        }
        else {
            throw new Error("action "+action.action+" is not a valid action for field "+action.name);
        }
    };
});