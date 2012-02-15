/**
 *
 * Albasim bootstrap class, contains module definitions.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
var Y = YUI({
    charset: 'utf-8',
    lang: Config.lang,
    debug: Config.debug,
    loadOptional: true,
    insertBefore: 'customstyles',
    gallery: 'gallery-2011.02.18-23-10',
    throwFail:true,
    //combine: false,
    //timeout: 10000,
    //filter: 'debug',
    filter: (Config.debug)?'raw':'min',
    //filters: { event: 'debug' },
    //logExclude: { event : true },
    //logInclude: { event : true },
    //useBrowserConsole: true,
    errorFn: function(e) {
        Y.log('Uncaught error: '+((e.stack)?e.stack:e), 'error', 'Wegas.App');
    },
    groups: {
        wegas: {
            combine: false,
            base: Config.base,
            //comboBase: Config.path+'combo/?',
            //root: 'rr',
            modules:  {
                /*************************************************************** Base */
                'wegas-app': {
                    path: 'wegas-app/js/wegas-app.js',
                    requires: ['stylesheet', 
                    'wegas-appcss',  'wegas-datasourcerest', 'wegas-widget', 'wegas-widgetloader',
                    // FIXME those should be included on the fly
                    'wegas-layout', 'wegas-text', 'wegas-list', 'wegas-tabview', 'wegas-datatable', 'wegas-displayarea',
                    'wegas-widgetloader', 'wegas-variabledisplay', 'wegas-button', 'wegas-chat', 
                    'wegas-projectmanagementgame'
                    ]
                },
                'wegas-appcss': {
                    path: 'wegas-app/assets/wegas-app.css',
                    type: 'css'
                },
                'wegas-datasourcerest': {
                    path: 'wegas-app/js/wegas-datasourcerest.js',
                    requires: ['plugin', 'json', 'io-base', "datasource-io", "datasource-jsonschema", "datasource-cache", 'array-extras'
                    /*'json-stringify', "datatype-date */]
                },
                /*************************************************************** Widgets */
                'wegas-widget': {
                    path: 'wegas-app/js/wegas-widget.js',
                    requires: ['widget', 'widget-parent', 'widget-child']
                },
                'wegas-widgetloader': {
                    path: 'wegas-app/js/wegas-widgetloader.js'
                },
                'wegas-button': {
                    path: 'wegas-app/js/wegas-button.js'
                },
                'wegas-variabledisplay': {
                    path: 'wegas-app/js/wegas-variabledisplay.js',
                    requires: ['excanvas']
                },
                'wegas-chat': {
                    path: 'wegas-app/js/wegas-chat.js'
                },
                'wegas-layout': {
                    path: 'wegas-app/js/wegas-layout.js',
                    requires: ['yui2-layout']		    
                },
                'wegas-wireit-container': {
                    path: 'wegas-admin/js/wegas-wireit-container.js',
                    requires: ['wireit']
                },
                'wegas-list': {
                    path: 'wegas-app/js/wegas-list.js',
                    requires: ["substitute", "node-focusmanager"]
                },
                'wegas-text': {
                    path: 'wegas-app/js/wegas-text.js'
                },
                'wegas-datatable': {
                    path: 'wegas-app/js/wegas-datatable.js',
                    requires: ['datatable', "datatable-datasource", 'yui2-button',
                    /*'datatable-events', 'datatable-sort',*/ ]
                },
                'wegas-treeview': {
                    path: 'wegas-app/js/wegas-treeview.js',
                    requires: [ 'yui2-treeview'
                    /*'gallery-yui3treeview', 'wegas-treeviewcss'*/]
                },
                /* This one is only seful w/ yui3 treeview widget */
                /* 'wegas-treeviewcss': {
                    path: 'wegas-app/assets/treeview-classic.css',
                    type: 'css'
                },
                'wegas-treeble': {
                    path: 'wegas-app/js/wegas-treeble.js',
                    requires: ['gallery-treeble', 'yui2-button' ]
                },*/
                'wegas-tabview': {
                    path: 'wegas-app/js/wegas-tabview.js',
                    requires: ['tabview', 'yui2-editor']
                },
                'wegas-displayarea': {
                    path: 'wegas-app/js/wegas-displayarea.js'
                },
                /*************************************************************** Editor */
                'wegas-editor': {
                    path: 'wegas-editor/js/wegas-editor.js',
                    requires: [
                    'wegas-inputex', 'wegas-app', 'wegas-treeview', 'wegas-logger', 'wegas-csseditor',
                    /* @fixme There is a bug in css include order, this one got hardcoded in the jsp file */
                    //'wegas-editorcss'
                    ]
                },
                'wegas-editorcss': {
                    path: 'wegas-editor/assets/wegas-editor.css',
                    type: 'css'
                },
                
                /************************************************************** Editor Widget's */
                'wegas-logger': {
                    path: 'wegas-editor/js/wegas-logger.js',
                    requires: ['console', 'console-filters']
                },
                'wegas-inputex':{
                    path: 'wegas-app/js/wegas-inputex.js',
                    requires: [
                    'inputex', 'inputex-form', 'inputex-email', 'inputex-radio', 'inputex-url', 
                    'inputex-select', 'inputex-checkbox', 'inputex-list', 'inputex-hidden', 
                    'inputex-password', 'inputex-group', 'inputex-string', 'inputex-textarea',
                    'inputex-keyvalue', 'inputex-combine', "inputex-field", 'yui2-editor', "inputex-rte" ]
                },
                'wegas-csseditor': {
                    path: 'wegas-editor/js/wegas-csseditor.js'
                },
                
                /************************************************************** PMG */
                'wegas-projectmanagementgame': {
                    path: 'wegas-projectmanagementgame/js/wegas-projectmanagementgame.js'
                }
                
            }
        },
        wireit: {
            combine: false,
            base: "lib/wireit/",
            //comboBase: Config.path+'combo/?',
            //root: 'dd',
            modules:  {
                'wireit': {
                    path: 'build/wireit.js',
                    //path: 'js/WireIt.js',
                    requires: ["yui2-utilities", 'excanvas']
                },
                'wire': {
                    path: 'js/Wire.js',
                    requires: ['wireit', 'wireit-dd', 'wireit-anim', 'canvaselement', 'terminal']
                },
                'canvaselement': {
                    path: 'js/CanvasElement.js'
                },
                'terminal': {
                    path: 'js/Terminal.js'
                },
                'excanvas': {
                    path: 'lib/excanvas.js'
                },
                'wireit-anim': {
                    path: 'js/util/Anim.js'
                },
                'wireit-dd': {
                    path: 'js/util/DD.js'
                }
            }
        },
        yui2: {
            base: Config.base+'lib/yui2in3/build/',
            // combine: true,
            // comboBase: 'http://myserver.com/combo?',
            // root: '/2in3/build/',
            patterns:  {
                'yui2-': {
                    configFn: function(me) {
                        if(/-skin|reset|fonts|grids|base/.test(me.name)) {
                            me.type = 'css';
                            me.path = me.path.replace(/\.js/, '.css');
                            me.path = me.path.replace(/\/yui2-skin/, '/assets/skins/sam/yui2-skin');
                        }
                    }
                }
            }
        }
	
    }
}).use('wegas-app', 'wegas-editor', function (Y) {
    
    Y.on('domready', function() {						// Launch the app as soon as Dom is ready
        var editor = new Y.Wegas.Editor(Config);
        editor.render();
    });
    
});