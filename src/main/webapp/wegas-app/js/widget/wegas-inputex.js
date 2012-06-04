/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inputex', function(Y) {
    "use strict";

    // *** Ace Field *** //
    var inputEx = Y.inputEx,
    lang = Y.Lang;

    /**
     * Wrapper for ace code editor
     */
    inputEx.AceField = function(options) {
        inputEx.AceField.superclass.constructor.call(this,options);
    };
    Y.extend(inputEx.AceField, inputEx.Field, {
        /**
        * Set the default values of the options
        * @param {Object} options Options object as passed to the constructor
        */
        setOptions: function (options) {
            inputEx.AceField.superclass.setOptions.call(this, options);

            this.options.language = options.language || "javascript";
            this.options.height = options.height || "150px";
        },

        /**
	 * Render the field using the YUI Editor widget
	 */
        renderComponent: function () {
            this.el = Y.Node.create('<div style="height: ' + this.options.height +';width: 100%;position: initial;">'
                + (this.options.value ? this.options.value : "") + '</div>');
            this.fieldContainer.appendChild(this.el.getDOMNode());
            this.fieldContainer.style["position"] = "relative";

            this.editor = ace.edit(this.el.getDOMNode());
            this.editor.setHighlightActiveLine(false);
            this.editor.renderer.setHScrollBarAlwaysVisible(false);
            this.session = this.editor.getSession();

            var Mode = require("ace/mode/" + this.options.language).Mode;
            this.session.setMode(new Mode());

            Y.Wegas.app.on("layout:resize", function() {
                 Y.on('domready', this.editor.resize, this.editor);
            }, this);

            this.session.addEventListener("tokenizerUpdate", Y.bind(function(e) {
               // console.log("mmmm");
                var i, token,
                    tokens = this.session.getTokens(e.data.first, e.data.last);

                for (i = 0; i > tokens.length; i += 1) {
                    token = tokens[i];
                    //identifier
                }
            }, this));
        },

        genTree: function(token) {

        },

        /**
	 * Set the html content
	 * @param {String} value The html string
	 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
	 */
        setValue: function(value, sendUpdatedEvt) {
            this.session.setValue(value);
            if(sendUpdatedEvt !== false) {
                // fire update event
                this.fireUpdatedEvt();
            }
        },

        /**
	 * Get the ace content
	 * @return {String} the ace area content string
	 */
        getValue: function() {
            return this.session.getValue();
        }


    });

    // Register this class as "html" type
    inputEx.registerType("ace", inputEx.AceField, []);


    /*
     * @hack prevents KeyValueField to return the selector field
     */
    Y.inputEx.KeyValueField.prototype.getValue = function () {
        return this.inputs[1].getValue();
    };
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


    /**
     * @fixme Hack to get the rtefield to interpret the parameters given through the opts config object.
     */
    Y.inputEx.RTEField.prototype.setValue = function (value, sendUpdatedEvt) {
        if (this.editor) {
            var iframeId = this.el.id + "_editor";

            // if editor iframe not rendered
            if (!Y.YUI2.util.Dom.get(iframeId)) {
                // put value in textarea : will be processed by this.editor._setInitialContent (clean html, etc...)
                //this.el.value = value;
                this.editor.on('editorContentLoaded', function () {               /* @modified */
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
    Y.inputEx.RTEField.prototype.renderComponent = function () {
        if (!inputEx.RTEfieldsNumber) {
            inputEx.RTEfieldsNumber = 0;
        }

        var id = "inputEx-RTEField-" + inputEx.RTEfieldsNumber,
        attributes = {
            id: id
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
        var editorType = ((this.options.editorType && (this.options.editorType == 'simple')) ? Y.YUI2.widget.SimpleEditor : Y.YUI2.widget.Editor);

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
            * @param {String} html The html string
            * @return {String} The html string
            */
        this.editor.filter_msword = function (html) {

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

});