/**
 * @module wegas-inputex-rte
 */
YUI.add("wegas-inputex-rte", function (Y){
    var inputEx = Y.inputEx;

    /**
     * Wrapper for the Rich Text Editor from YUI
     * @class inputEx.RTEField
     * @extends inputEx.Field
     * @constructor
     * @param {Object} options Added options:
     * <ul>
     *   <li>opts: the options to be added when calling the RTE constructor (see YUI RTE)</li>
     *   <li>editorType: if == 'simple', the field will use the SimpleEditor. Any other value will use the Editor class.</li>
     * </ul>
     */
    inputEx.RTEField = function (options) {
        inputEx.RTEField.superclass.constructor.call(this,options);
    };
    Y.extend(inputEx.RTEField, inputEx.Field, {
        /**
         * Set the default values of the options
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            inputEx.RTEField.superclass.setOptions.call(this, options);

            this.options.opts = options.opts || {};
            this.options.editorType = options.editorType;
        },

        /**
	 * Render the field using the YUI Editor widget
	 */
        renderComponent: function() {
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
                width: '100%',                                                      // @modified
                dompath: false,
                animate: true,
                autoHeight: true,
                filterWord:true,                                                    // get rid of the MS word junk
                extracss: 'p {margin:0} ',
                toolbar: {
                    collapse: false,
                    titlebar: '',
                    draggable: false,
                    buttonType: 'advanced',
                    buttons: [ {
                        group: 'textstyle',
                        buttons: [{
                            type: 'push',
                            label: 'Bold CTRL + SHIFT + B',
                            value: 'bold'
                        }, {
                            type: 'push',
                            label: 'Italic CTRL + SHIFT + I',
                            value: 'italic'
                        }, {
                            type: 'push',
                            label: 'Underline CTRL + SHIFT + U',
                            value: 'underline'
                        }, {
                            type: 'separator'
                        },
                        //{
                        //    type: 'push',
                        //    label: 'Subscript',
                        //    value: 'subscript',
                        //    disabled: true
                        //}, {
                        //    type: 'push',
                        //    label: 'Superscript',
                        //    value: 'superscript',
                        //    disabled: true
                        //}, {
                        //    type: 'separator'
                        //},
                        {
                            type: 'color',
                            label: 'Font Color',
                            value: 'forecolor',
                            disabled: true
                        }, {
                            type: 'color',
                            label: 'Background Color',
                            value: 'backcolor',
                            disabled: true
                        }, {
                            type: 'separator'
                        }, {
                            type: 'push',
                            label: 'Remove Formatting',
                            value: 'removeformat',
                            disabled: true
                        }, {
                            type: 'push',
                            label: 'Show/Hide Hidden Elements',
                            value: 'hiddenelements'
                        }]
                    }, {
                        type: 'separator'
                    },{
                        group: 'fontstyle',
                        buttons: [
                        //{
                        //type: 'select',
                        //label: 'Arial',
                        //value: 'fontname',
                        //disabled: true,
                        //menu: [{
                        //    text: 'Arial',
                        //    checked: true
                        //}, {
                        //    text: 'Arial Black'
                        //}, {
                        //    text: 'Comic Sans MS'
                        //}, {
                        //    text: 'Courier New'
                        //}, {
                        //    text: 'Lucida Console'
                        //}, {
                        //    text: 'Tahoma'
                        //}, {
                        //    text: 'Times New Roman'
                        //},{
                        //    text: 'Trebuchet MS'
                        //},{
                        //    text: 'Verdana'
                        //}]
                        //},
                        {
                            type: 'spin',
                            label: '13',
                            value: 'fontsize',
                            range: [ 9, 75 ],
                            disabled: true
                        }
                        ]
                    }, {
                        type: 'separator'
                    },{
                        group: 'alignment',
                        buttons: [{
                            type: 'push',
                            label: 'Align Left CTRL + SHIFT + [',
                            value: 'justifyleft'
                        },{
                            type: 'push',
                            label: 'Align Center CTRL + SHIFT + |',
                            value: 'justifycenter'
                        },{
                            type: 'push',
                            label: 'Align Right CTRL + SHIFT + ]',
                            value: 'justifyright'
                        },{
                            type: 'push',
                            label: 'Justify',
                            value: 'justifyfull'
                        }]
                    },{
                        type: 'separator'
                    },{
                        group: 'parastyle',
                        buttons: [{
                            type: 'select',
                            label: 'Normal',
                            value: 'heading',
                            disabled: true,
                            menu: [{
                                text: 'Normal',
                                value: 'none',
                                checked: true
                            },{
                                text: 'Header 1',
                                value: 'h1'
                            },{
                                text: 'Header 2',
                                value: 'h2'
                            },{
                                text: 'Header 3',
                                value: 'h3'
                            },{
                                text: 'Header 4',
                                value: 'h4'
                            }, {
                                text: 'Header 5',
                                value: 'h5'
                            }, {
                                text: 'Header 6',
                                value: 'h6'
                            }]
                        }]
                    },{
                        type: 'separator'
                    }, {
                        group: 'indentlist',
                        buttons: [{
                            type: 'push',
                            label: 'Indent',
                            value: 'indent',
                            disabled: true
                        }, {
                            type: 'push',
                            label: 'Outdent',
                            value: 'outdent',
                            disabled: true
                        }, {
                            type: 'push',
                            label: 'Create an Unordered List',
                            value: 'insertunorderedlist'
                        }, {
                            type: 'push',
                            label: 'Create an Ordered List',
                            value: 'insertorderedlist'
                        }]
                    }, {
                        type: 'separator'
                    }, {
                        group: 'insertitem',
                        buttons: [{
                            type: 'push',
                            label: 'HTML Link CTRL + SHIFT + L',
                            value: 'createlink',
                            disabled: true
                        },{
                            type: 'push',
                            label: 'Insert Image',
                            value: 'insertimage'
                        }]
                    }]
                }
            };
            //The options object
            var o = this.options.opts;
            //Walk it to set the new config object
            for (var i in o) {
                //if (lang.hasOwnProperty(o, i)) {                                  // @modified
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

            /**
                 * Plugin to add support for image and links from Wegas file library.
                 */
            this.editor.addListener('toolbarLoaded', function(e,o) {
                this.editor.subscribe( 'afterOpenWindow', function(e) {  //afterOpenWindow or windowRender
                    var targetNode = new Y.Node(e.win.body.firstChild);
                    this.inputNode = targetNode.one('input');

                    switch (e.win.name){
                        case 'insertimage':
                            if ( !this._insertimageRendered ){                      // if the newly inserted window is the image manager, we catch and modify
                                this.inputNode.setStyle('width', '276px');
                                this.imgButton = new Y.Button({
                                    label: "<span class=\"wegas-icon wegas-icon-fileexplorer\"></span>",
                                    on: {
                                        click: Y.bind(this.showFileExplorer, this)
                                    }
                                }).render(targetNode);

                                this._insertimageRendered= true;
                            }
                            break;
                        case 'createlink':
                            if ( !this._createlinkRendered ){
                                this.inputNode.setStyle('width', '226px');

                                this.linkButton = new Y.Button({
                                    label: "<span class=\"wegas-icon wegas-icon-fileexplorer\"></span>",
                                    on: {
                                        click: Y.bind(this.showFileExplorer, this)
                                    }
                                }).render(targetNode);

                                this._createlinkRendered= true;
                            }
                            break;
                    }
                }, null, this);
            }, null, this);


            /**
                 * Add the view source plugin
                 */
            this.editor.state = 'off';
            this.editor.on('toolbarLoaded', function() {
                var codeConfig = {
                    type: 'push',
                    label: 'Edit HTML Code',
                    value: 'editcode'
                };
                Y.log('Create the (editcode) Button', 'info', 'Wegas.RTEField');
                this.toolbar.addButtonToGroup(codeConfig, 'insertitem');

                this.toolbar.on('editcodeClick', function() {
                    var ta = this.get('element'),
                    iframe = this.get('iframe').get('element');

                    if (this.state == 'on') {
                        this.state = 'off';
                        this.toolbar.set('disabled', false);
                        Y.log('Show the Editor', 'info', 'Wegas.RTEEditor');
                        Y.log('Inject the HTML from the textarea into the editor', 'info', 'Wegas.RTEEditor');
                        this.setEditorHTML(ta.value);
                        if (!this.browser.ie) {
                            this._setDesignMode('on');
                        }

                        Y.YUI2.util.Dom.removeClass(iframe, 'editor-hidden');
                        Y.YUI2.util.Dom.addClass(ta, 'editor-hidden');
                        this.show();
                        this._focusWindow();
                    } else {
                        this.state = 'on';
                        Y.log('Show the Code Editor', 'info', 'Wegas.RTEEditor');
                        this.cleanHTML();
                        Y.log('Save the Editors HTML', 'info', 'Wegas.RTEEditor');
                        Y.YUI2.util.Dom.addClass(iframe, 'editor-hidden');
                        Y.YUI2.util.Dom.removeClass(ta, 'editor-hidden');
                        this.toolbar.set('disabled', true);
                        this.toolbar.getButtonByValue('editcode').set('disabled', false);
                        this.toolbar.selectButton('editcode');
                        this.dompath.innerHTML = 'Editing HTML Code';
                        this.hide();
                    }
                    return false;
                }, this, true);

                this.on('cleanHTML', function(ev) {
                    //Y.log('cleanHTML callback fired..', 'info', 'Wegas.RTEEditor');
                    this.get('element').value = ev.html;
                }, this, true);

                this.on('afterRender', function() {
                    var wrapper = this.get('editor_wrapper');
                    wrapper.appendChild(this.get('element'));
                    this.setStyle('width', '100%');
                    this.setStyle('height', '100%');
                    this.setStyle('visibility', '');
                    this.setStyle('top', '');
                    this.setStyle('left', '');
                    this.setStyle('position', '');

                    this.addClass('editor-hidden');
                }, this, true);

            }, this.editor, true);
        },

        /**
         * Set the html content
         * @param {String} value The html string
         * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
         */
        setValue: function (value, sendUpdatedEvt) {
            if (this.editor) {
                var iframeId = this.el.id + "_editor";

                if (!Y.YUI2.util.Dom.get(iframeId)) {                           // if editor iframe not rendered
                    //this.el.value = value;                                    // put value in textarea : will be processed by this.editor._setInitialContent (clean html, etc...)
                    this.editor.on('editorContentLoaded', function () {         /* @modified */
                        this.editor.setEditorHTML(value);
                    }, value, this);
                } else {
                    this.editor.setEditorHTML(value);
                }
            }
        // if(sendUpdatedEvt !== false) {
        //
        //     this.fireUpdatedEvt();                                           // fire update event
        // }
        },

        /**
         * Get the html string
         * @return {String} the html string
         */
        getValue: function () {
            try {
                if (this.editor.state == "on") {                                // If source code is displayed, we return this value
                    this.editor.setEditorHTML(this.editor.get('element').value);
                }

                if (this.editor.currentWindow) {                                // trigger HTML cleaning (strip MS word or internal junk)
                    this.editor.closeWindow();                                  // + save to hidden textarea (required for classic HTML 'submit')
                }
                return this.editor.saveHTML();
            } catch (ex) {
                return null;
            }
        },

        showFileExplorer: function () {
            if (!this.filepanel) {
                this.filepanel = new Y.Panel({
                    bodyContent: '',
                    headerContent: 'Choose a file from library',
                    width  : 330,
                    zIndex : 5,
                    modal  : true,
                    render : true,
                    centered   : true
                });

                this.fileExplorer = new Y.Wegas.FileExplorer().render(this.filepanel.getStdModNode(Y.WidgetStdMod.BODY));

                this.fileExplorer.on("*:fileSelected", function (e, path) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    this.inputNode.set('value', path);
                    this.inputNode.focus();											//HACK we simulate the blur event to trigger the editor's image update
                    this.inputNode.blur();
                    this.filepanel.hide();
                }, this);
            }
            this.filepanel.show();
        }
    });

    // Register this class as "html" type
    inputEx.registerType("html", inputEx.RTEField, []);

},'3.0.0a',{
    requires: ['inputex-field']
});
