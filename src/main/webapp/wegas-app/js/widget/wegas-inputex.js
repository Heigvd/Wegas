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

YUI.add('wegas-inputex', function(Y) {
    "use strict";

    var inputEx = Y.inputEx,
    lang = Y.Lang;

    /**
     *  @hack So we can easily change classs on inputex fields
     */
    Y.inputEx.Field.prototype.addClassName = function ( className ) {
        Y.one( this.divEl ).addClass( className );
    };
    Y.inputEx.Field.prototype.removeClassName = function ( className ) {
        Y.one( this.divEl ).removeClass( className );
    };

    YUI_config.groups.inputex.modulesByType.html = "wegas-inputex-rte";         // @fix so inputex will use our own widgets when using f = Y.inpuex(cfg)
    YUI_config.groups.inputex.modulesByType.hashlist = "wegas-inputex-hashlist";
    YUI_config.groups.inputex.modulesByType.script = "wegas-script-wysiwyg";
    YUI_config.groups.inputex.modulesByType.ace = "wegas-inputex-ace";
    YUI_config.groups.inputex.modulesByType.wegasurl = "wegas-inputex-url";

    /**
     * @hack Let inputex also get requirement from selectfields, lists
     */
    Y.inputEx.getRawModulesFromDefinition = function(inputexDef) {
        function walk(cfg) {                                                    // recursive for group,forms,list,combine, etc...
            var type = cfg.type || 'string',
            modules = [YUI_config.groups.inputex.modulesByType[type]];

            if(cfg.fields) {
                Y.Array.each(cfg.fields, function(field) {
                    modules = modules.concat( walk(field) );
                }, this);
            }
            if(cfg.availableFields) {
                Y.Array.each(cfg.availableFields, function(field) {
                    modules = modules.concat( walk(field) );
                }, this);
            }

            if (cfg.elementType) {
                modules = modules.concat( walk(cfg.elementType)  );
            }
            return modules;
        // TODO: list elementType
        // TODO: inplaceedit  editorField
        }
        var ret =  walk(inputexDef);
        return ret;
    }

    /*
     * @hack prevents KeyValueField to return the selector field
     */
    Y.inputEx.KeyValueField.prototype.getValue = function () {
        return this.inputs[1].getValue();
    };
    /*
     * @hack prevents KeyValueField to return the selector field
     */
    //    Y.inputEx.KeyValueField.prototype.setValue = function (val, e) {
    //        Y.inputEx.KeyValueField.superclass.setValue.apply(this, arguments)
    //        this.inputs[1].setValue(val);
    //    };
    /*
     * @hack Automatically add the "optional" message when necessary
     */
    Y.inputEx.StringField.prototype.setOptions = function (options) {
        Y.inputEx.StringField.superclass.setOptions.call(this, options);

        this.options.regexp = options.regexp;
        this.options.size = options.size;
        this.options.maxLength = options.maxLength;
        this.options.minLength = options.minLength;
        this.options.typeInvite = options.typeInvite;
        if (!this.options.required && !this.options.typeInvite) { // !!!MODIFIED!!!
            this.options.typeInvite = "optional";
        }
        this.options.readonly = options.readonly;
        this.options.autocomplete = lang.isUndefined(options.autocomplete) ?
        inputEx.browserAutocomplete :
        (options.autocomplete === false || options.autocomplete === "off") ? false : true;
        this.options.trim = (options.trim === true) ? true : false;
    };
});