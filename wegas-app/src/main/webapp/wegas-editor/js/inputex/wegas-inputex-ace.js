/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-inputex-ace', function(Y) {
    "use strict";

    var inputEx = Y.inputEx;

    /**
     * Ace code editor field
     */
    inputEx.AceField = function(options) {
        inputEx.AceField.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.AceField, inputEx.Textarea, {
        /**
         * Set the default values of the options
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            inputEx.AceField.superclass.setOptions.call(this, options);

            this.options.language = options.language || "javascript";
            this.options.theme = options.theme || "textmate";
            this.options.height = options.height || "150px";
        },
        disable: function() {
            this.editor.setReadOnly(true);
        },
        enable: function() {
            this.editor.setReadOnly(false);
        },
        /**
         * Render the field using the YUI Editor widget
         */
        renderComponent: function() {
            if (window.ace) {                                                   // Ace is present, launch it
                this.el = Y.Node.create('<div>' + (this.options.value || "") + '</div>');//@fixme
                this.fieldContainer.appendChild(this.el.getDOMNode());

                this.editor = ace.edit(this.el.getDOMNode());
                this.editor.setTheme("ace/theme/" + this.options.theme);
                this.editor.setShowPrintMargin(false);
                //this.editor.setOptions({
                //    //enableBasicAutocompletion: true,
                //    enableSnippets: true
                //});
                //this.editor.setHighlightActiveLine(false);
                //this.editor.renderer.setHScrollBarAlwaysVisible(false);

                this.session = this.editor.getSession();
                this.session.setMode("ace/mode/" + this.options.language);

                Y.Wegas.app.after("layout:resize", function() {                 // Every time the layout is resized (wegas editor only)
                    Y.once('domready', this.resize, this);                      // resize ace viewport
                }, this.editor);

                Y.after('windowresize', Y.bind(this.editor.resize, this.editor));// Every time window is resized, resize ace viewport
            } else {                                                            // Fallback with textarea
                Y.log("Unable to find Ace libraries, falling back to text field", "error", "Wegas.Inputex.Ace");
                inputEx.AceField.superclass.renderComponent.call(this);
            }
        },
        /**
         * Set the html content
         * @param {String} value The html string
         * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
         */
        setValue: function(value, sendUpdatedEvt) {
            if (this.session) {
                this.session.setValue(value);
                if (sendUpdatedEvt !== false) {
                    // fire update event
                    this.fireUpdatedEvt();
                }
            } else {    // fallback
                return inputEx.AceField.superclass.setValue.apply(this, arguments);
            }
        },
        /**
         * Get the ace content
         * @return {String} the ace area content string
         */
        getValue: function() {
            if (this.session) {
                return this.session.getValue();
            } else {
                return inputEx.AceField.superclass.getValue.apply(this);
            }
        }
    });

    inputEx.registerType("ace", inputEx.AceField, []);                          // Register this class as "html" type
});
