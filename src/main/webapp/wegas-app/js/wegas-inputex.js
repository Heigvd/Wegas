/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inputex', function(Y) {
    var YAHOO = Y.YUI2,
    inputEx = Y.inputEx,
    lang = Y.Lang;
    
    /*
     * @hack prevents KeyValueField to return the selector field 
     */
    Y.inputEx.KeyValueField.prototype.getValue = function() {
        return this.inputs[1].getValue();
    };
    /*
     * @hack Automatically add the "optional" message when necessary
     */
    Y.inputEx.StringField.prototype.setOptions = function(options) {
        Y.inputEx.StringField.superclass.setOptions.call(this, options);

        this.options.regexp = options.regexp;
        this.options.size = options.size;
        this.options.maxLength = options.maxLength;
        this.options.minLength = options.minLength;
        this.options.typeInvite = options.typeInvite;
        if (!this.options.required && !this.options.typeInvite) this.options.typeInvite = "optional";   // !!!MODIFIED!!!
        this.options.readonly = options.readonly;
        this.options.autocomplete = lang.isUndefined(options.autocomplete) ?
        inputEx.browserAutocomplete :
        (options.autocomplete === false || options.autocomplete === "off") ? false : true;
        this.options.trim = (options.trim === true) ? true : false;
    };
       
       
    /**
     * @fixme Hack to get the rtefield to interpret the parameters given through the opts config object.
     */
    Y.inputEx.RTEField.prototype.setValue= function(value, sendUpdatedEvt) {
        if(this.editor) {
            var iframeId = this.el.id+"_editor";
	      
            // if editor iframe not rendered
            if (!YAHOO.util.Dom.get(iframeId)) {
                // put value in textarea : will be processed by this.editor._setInitialContent (clean html, etc...)
                //this.el.value = value;
                this.editor.on('editorContentLoaded', function(){               /* @modified */
                    this.editor.setEditorHTML(value);
                }, value, this);
            } else {
                this.editor.setEditorHTML(value);
            }
        }
    }
    /**
     * @fixme Hack to get the rtefield to interpret the parameters given through the opts config object.
     */
    Y.inputEx.RTEField.prototype.renderComponent = function() {
        if(!inputEx.RTEfieldsNumber) {
            inputEx.RTEfieldsNumber = 0;
        }
	   
        var id = "inputEx-RTEField-"+inputEx.RTEfieldsNumber,
        attributes = {
            id:id
        };
        if(this.options.name) {
            attributes.name = this.options.name;
        }
      
        this.el = inputEx.cn('textarea', attributes);
	   
        inputEx.RTEfieldsNumber += 1;
        this.fieldContainer.appendChild(this.el);
	
        //This is the default config
        var _def = {
            height: '300px',
            width: '580px',
            dompath: true,
            filterWord:true // get rid of the MS word junk
        };
        //The options object
        var o = this.options.opts;
        //Walk it to set the new config object
        for (var i in o) {
            //if (lang.hasOwnProperty(o, i)) {                                  // !!!MODIFIED!!!
            _def[i] = o[i];
        //}
        }
        //Check if options.editorType is present and set to simple, if it is use SimpleEditor instead of Editor
        var editorType = ((this.options.editorType && (this.options.editorType == 'simple')) ? YAHOO.widget.SimpleEditor : YAHOO.widget.Editor);
	
        //If this fails then the code is not loaded on the page
        if (editorType) {
            this.editor = new editorType(id, _def);
            this.editor.render();
        } else {
            alert('Editor is not on the page');
        }
	   
	   
        /**
             * Filters out msword html comments, classes, and other junk
             * (complementary with YAHOO.widget.SimpleEditor.prototype.filter_msword, when filterWord option is true)
             * @param {String} value The html string
             * @return {String} The html string
             */
        this.editor.filter_msword = function(html) {
   	   
            html = editorType.prototype.filter_msword.call(this,html);
   	   
            // if we don't filter ms word junk
            if (!this.get('filterWord')) {
                return html;
            }

            html = html.replace( /<!--[^>][\s\S]*-->/gi, ''); // strip (meta-)comments
            html = html.replace( /<\/?meta[^>]*>/gi, ''); // strip meta tags
            html = html.replace( /<\/?link[^>]*>/gi, ''); // strip link tags
            html = html.replace( / class=('|")?MsoNormal('|")?/gi, ''); // strip MS office class
            html = Y.Lang.trim(html); // trim spaces
         
            return html;
        };
   	
    };
/*
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
    };*/
});