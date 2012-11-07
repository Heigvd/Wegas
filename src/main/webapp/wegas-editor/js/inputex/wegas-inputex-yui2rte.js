/**
 * @module wegas-inputex-rte
 */
YUI.add("wegas-inputex-rte", function (Y){
    var inputEx = Y.inputEx,
    Dom = Y.YUI2.util.Dom;

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

        destroy: function () {
            this.editor.destroy();

            inputEx.RTEField.superclass.destroy.call( this );
        },

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
                width: '100%',
                //  height: '300px',
                autoHeight: true,
                dompath: false,
                animate: true,
                filterWord: true,                                               // get rid of the MS word junk (but is unfortunately too restrictive
                extracss: 'p {margin:0} .wegas-media {font-size:100px; height: 120px; width: 200px; display:inline-block; border: 1px solid gray; background-color: #f2f2f2; background-image: url( ' + Y.Wegas.app.get( "base" ) + 'wegas-editor/images/wegas-icon-video.png ); background-position: 45% 45%; background-repeat: no-repeat; } .wegas-media * {display: none; }',
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
                        }
                        //{
                        //    type: 'separator'
                        //}, {
                        //    type: 'push',
                        //    label: 'Remove Formatting',
                        //    value: 'removeformat',
                        //    disabled: true
                        //}, {
                        //    type: 'push',
                        //    label: 'Show/Hide Hidden Elements',
                        //    value: 'hiddenelements'
                        //}
                        ]
                    },
                    //{
                    //    type: 'separator'
                    //},{
                    //    group: 'fontstyle',
                    //    buttons: [
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
                    //{
                    //    type: 'spin',
                    //    label: '13',
                    //    value: 'fontsize',
                    //    range: [ 9, 75 ],
                    //    disabled: true
                    //}
                    //]
                    //},
                    {
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
                        }, {
                            type: 'push',
                            label: 'Insert Image',
                            value: 'insertimage'
                        }, {
                            type: 'push',
                            label: 'Insert video',
                            value: 'insertmedia'
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
                this.editor.subscribe( 'afterOpenWindow', function( e ) {       // afterOpenWindow or windowRender
                    var value = null;
                    switch ( e.win.name ){
                        case 'insertimage':
                            if ( this.editor.currentElement[0] && this.editor.currentElement[0].src.indexOf("blankimage.png") == -1 ) {
                                value = this.editor.currentElement[0].src;
                            }
                            if ( !this._insertimageRendered ){                  // if the newly inserted window is the image manager, we catch and modify
                                var targetNode = new Y.Node( e.win.body );
                                this.fileInputNode = targetNode.one('input');

                                targetNode.one( "label" ).setStyle( 'display', 'none' );
                                targetNode.prepend( "<div></div>" );

                                this.imageUrlField = new inputEx.Wegas.UrlField({
                                    parentEl: targetNode.one( "div" ),
                                    label: "Url",
                                    typeInvite: "Enter a link or choose a file from the library"
                                });

                                this.imageUrlField.on( "updated", function ( val ) {
                                    val = Y.Plugin.CRDataSource.getFullpath( val );
                                    this.fileInputNode.set('value', val);
                                    this.fileInputNode.focus();											//HACK we simulate the blur event to trigger the editor's image update
                                    this.fileInputNode.blur();
                                }, this );
                                this._insertimageRendered= true;
                            }

                            this.imageUrlField.setValue( value, false );
                            break;
                        case 'createlink':
                            if ( this.editor.currentElement[0] ) {
                                value = this.editor.currentElement[0].href;
                            }
                            if ( !this._createlinkRendered ){
                                var targetNode = new Y.Node( e.win.body );
                                this.inputNode = targetNode.one('input');
                                targetNode.one( "label" ).setStyle( 'display', 'none' );
                                targetNode.prepend( "<div></div>" );

                                this.linkUrlField = new inputEx.Wegas.UrlField({
                                    parentEl: targetNode.one( "div" ),
                                    label: "Url",
                                    typeInvite: "Enter a link or choose a file from the library"
                                });

                                this.linkUrlField.on( "updated", function ( val ) {
                                    val = Y.Plugin.CRDataSource.getFullpath( val );
                                    this.inputNode.set('value', val);
                                    this.inputNode.focus();											//HACK we simulate the blur event to trigger the editor's image update
                                    this.inputNode.blur();
                                }, this );

                                this._createlinkRendered= true;
                            }
                            this.linkUrlField.setValue( value, false );
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
                        if ( this.dompath ) {
                            this.dompath.innerHTML = 'Editing HTML Code';
                        }
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

            /**
             * Add the insert video plugin
             */
            var that = this, _handleWindowClose = function() {
                var val = this.videoUrlField.getValue(),
                el = this.editor.currentElement[0];


                el.setAttribute('data-url',  val );
                el.innerHTML = inputEx.RTEField.urlToEmbed( val );
                //el.setHTML( "mm" );
                // el.setAttribute( "data-videourl", val );
                this.editor.nodeChange();
            }, _handleMediaWindow = function() {
                var el = this._getSelectedElement(),
                node = new Y.Node( el ),
                win = new Y.YUI2.widget.EditorWindow('insertmedia', {
                    width: '415px'
                });
                win.setHeader('Edit video');
                that.videoUrlField.setValue( node.getAttribute( "data-url" ) );

                this.openWindow( win );

                this.on( 'afterOpenWindow', function() {
                    this.get('panel').syncIframe();
                }, this, true );

            };
            this.editor.on('windowinsertmediaClose', function() {
                _handleWindowClose.call(this);
            }, this, true);

            this.editor.cmd_insertmedia = function() {
                this.execCommand('insertimage', 'none');
                var el = this._swapEl(this.currentElement[0], 'p', function(el) {
                    el.className = 'wegas-media';
                });
                this.currentElement = [el];
                _handleMediaWindow.call(this);

                return [false];
            };

            this.editor.on('editorDoubleClick', function() {
                var el = this._getSelectedElement();
                if (Dom.hasClass(el, 'wegas-media')) {
                    this.currentElement = [el];
                    _handleMediaWindow.call(this);
                    return false;
                }
            }, this.editor, true);
            this.editor.on('afterNodeChange', function() {
                if (this._hasSelection()) {
                    this.toolbar.disableButton('insertmedia');
                } else {
                    this.toolbar.enableButton('insertmedia');
                    var el = this._getSelectedElement();
                    if (Dom.hasClass(el, 'wegas-media')) {
                        this.toolbar.selectButton('insertmedia');
                    } else {
                        this.toolbar.deselectButton('insertmedia');
                    }
                }
            }, this.editor, true);
            this.editor.on('toolbarLoaded', function() {
                this.toolbar.on('insertmediaClick', function() {
                    var el = this._getSelectedElement();
                    if (Dom.hasClass(el, 'wegas-media')) {
                        this.currentElement = [el];
                        _handleMediaWindow.call(this);
                        return false;
                    }
                }, this, true);
            }, this.editor, true);
            this.editor.on('windowRender', function () {
                var body = Y.Node.create('<div class="wegas-rte-videoplugin-body"></div>');

                this.videoUrlField = new inputEx.Wegas.UrlField({
                    parentEl: body,
                    label: "Url",
                    typeInvite: "Enter a youtube link or choose a file in the library"
                });
                this.videoUrlField.on( "updated", function ( val ) {
                    body.one( ".preview" ).setContent( inputEx.RTEField.urlToEmbed( val, 388 ) );
                //this.moveWindow();
                //this.get('panel').syncIframe();
                }, this );

                body.append( 'Preview <br /><div class="preview"></div>' );
                this.editor._windows.insertmedia = {
                    body: body.getDOMNode()
                };

            }, this, true );

            this.editor.render();
        },

        /**
         * Set the html content
         * @param {String} value The html string
         * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
         */
        setValue: function ( value, sendUpdatedEvt ) {
            if (this.editor) {
                var iframeId = this.el.id + "_editor";

                if (!Y.YUI2.util.Dom.get(iframeId)) {                           // if editor iframe not rendered
                    //this.el.value = value;                                    // put value in textarea : will be processed by this.editor._setInitialContent (clean html, etc...)
                    this.loaded = false;
                    this.value = value;
                    this.editor.on( 'editorContentLoaded', function ( v ) {  /* @modified */
                        if ( !this.loaded ) {
                            this.editor.setEditorHTML( this.value );
                            this.loaded = true;
                        }
                    }, value, this);
                } else {
                    this.editor.setEditorHTML(value);
                    this.loaded = true;
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
                    this.editor.setEditorHTML( this.editor.get('element').value );
                }

                if (this.editor.currentWindow) {                                // trigger HTML cleaning (strip MS word or internal junk)
                    this.editor.closeWindow();                                  // + save to hidden textarea (required for classic HTML 'submit')
                }
                return this.editor.saveHTML();
            } catch ( ex ) {
                return null;
            }
        }
    }, {
        urlToEmbed: function ( url, width, height) {

            width = width || 388;
            height = height || 250;

            if ( /\.youtube\..*v=/i.test( url ) ) {                             // Youtube video
                var id = /v=[^&]*&/.exec( url )[0].substr( 2 );
                return '<object type="application/x-shockwave-flash" style="width:' + width +'px; height:' + height + 'px;" data="http://www.youtube.com/v/' + id + '?version=3">' +
                '<param name="movie" value="http://www.youtube.com/v/' + id + '?version=3" />' +
                '<param name="allowFullScreen" value="true" />' +
                '<param name="allowscriptaccess" value="always" />' +
                '</object>';

            } else if ( /^\/.*\.mp4/i.test( url ) ) {                           // Self-hosted mp4 videos
                var vidUrl = Y.Plugin.CRDataSource.getFullpath( url );
                return '<video height="' + height + '" width="' + width + '" controls>' +
                '<source src="' + vidUrl + '" type="video/mp4" />' +
                //'<source src="" type="video/webm">' +
                '</video>';

            //<script type="text/javascript" src="/jwplayer/jwplayer.js"></script>
            //<video height="270" width="480" id="myVideo">
            //  <source src="/static/bunny.mp4" type="video/mp4">
            //</video>
            //<script type="text/javascript">
            //  jwplayer("myVideo").setup({
            //    modes: [
            //        { type: 'html5' },
            //        { type: 'flash', src: '/jwplayer/player.swf' }
            //    ]
            //  });
            //</script>
            }

            return "<em>Unable to embed link</em>";
        }
    });

    // Register this class as "html" type
    inputEx.registerType("html", inputEx.RTEField, []);

},'3.0.0a',{
    requires: ['inputex-field']
});
