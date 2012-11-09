/**
 * @module inputex-url
 */
YUI.add("wegas-inputex-roleselect",function(Y){

    var inputEx = Y.inputEx;

    /**
     * Adds an url regexp, and display the favicon at this url
     * @class inputEx.UrlField
     * @extends inputEx.StringField
     * @constructor
     * @param {Object} options inputEx.Field options object
     * <ul>
     *   <li>favicon: boolean whether the domain favicon.ico should be displayed or not (default is true, except for https)</li>
     * </ul>
     */
    Y.namespace("inputEx.Wegas").RoleSelect = function(options) {
        inputEx.Wegas.RoleSelect.superclass.constructor.call(this,options);
    };

    Y.extend(inputEx.Wegas.RoleSelect, inputEx.SelectField, {

        setValue: function ( val, sendUpdatedEvent ) {
            inputEx.Wegas.RoleSelect.superclass.setValue.call(this, val.id, sendUpdatedEvent );
        },
        getValue: function ( ) {
            return {
                "@class": "Role",
                name: "",
                description: "",
                id: inputEx.Wegas.RoleSelect.superclass.getValue.call(this )
            }
        },
        setOptions: function (options) {
            inputEx.Wegas.RoleSelect.superclass.setOptions.call(this, options );
            this.options.choices = [];
            for ( var i = 0; i < Y.Wegas.RoleFacade.data.length; i = i + 1 ) {
                this.options.choices.push({
                    value: Y.Wegas.RoleFacade.data[i].get("id"),
                    label: Y.Wegas.RoleFacade.data[i].get("name")
                });
            }
        }
    });

    inputEx.registerType("roleselect", inputEx.Wegas.RoleSelect );             // Register this class as "wegasurl" type
});
