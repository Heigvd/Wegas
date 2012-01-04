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
    //combine: false,
    //timeout: 10000,
    //filter: 'debug',
    filter: (Config.debug)?'raw':'min',
    //filters: { event: 'debug' },
    //logExclude: { event : true },
    //logInclude: { event : true },
    //useBrowserConsole: true,
    groups: {
	wegas: {
	    combine: false,
	    base: Config.base,
	    //comboBase: Config.path+'combo/?',
	    //root: 'rr',
	    modules:  {
		/*************************************************************** Base */
		'wegas-app': {
		    path: 'wegas-base/js/wegas-app.js',
		    requires: [ 'wegas-appcss', 'wegas-widget', 'wegas-datasourcerest',
		    // FIXME those should be included on the fly
		    'wegas-layout', 'wegas-text', 'wegas-list', 'wegas-tabview', 'wegas-datatable', 'wegas-displayarea',
		    'wegas-logger'
		    ]
		},
		'wegas-appcss': {
		    path: 'wegas-base/assets/wegas-app.css',
		    type: 'css'
		},
		'wegas-datasourcerest': {
		    path: 'wegas-base/js/wegas-datasourcerest.js',
		    requires: ['plugin', 'json', 'io-base', "datasource-io", "datasource-jsonschema", "datasource-cache", 'array-extras'
		    /*'json-stringify', "datatype-date */]
		},
		/*************************************************************** Editor */
		'wegas-editor': {
		    path: 'wegas-editor/js/wegas-editor.js',
		    requires: ['wegas-editorcss',
		    'inputex', 'inputex-form', 'inputex-email', 'inputex-radio', 'inputex-url', 'inputex-select', 'inputex-checkbox', 'inputex-list'
		    ]
		},
		'wegas-editorcss': {
		    path: 'wegas-editor/assets/wegas-editor.css',
		    type: 'css'
		},
		/*************************************************************** Widgets */
		'wegas-widget': {
		    path: 'wegas-base/js/wegas-widget.js',
		    requires: ['widget', 'widget-parent', 'widget-child']
		},
		'wegas-logger': {
		    path: 'wegas-base/js/wegas-logger.js',
		    requires: ['console', 'console-filters']
		},
		'wegas-layout': {
		    path: 'wegas-base/js/wegas-layout.js',
		    requires: ['yui2-layout']		    
		},
		'wegas-wireit-container': {
		    path: 'wegas-admin/js/wegas-wireit-container.js',
		    requires: ['wireit']
		},
		'wegas-list': {
		    path: 'wegas-base/js/wegas-list.js',
		    requires: ["substitute", "node-focusmanager"]
		},
		'wegas-text': {
		    path: 'wegas-base/js/wegas-text.js'
		},
		'wegas-datatable': {
		    path: 'wegas-base/js/wegas-datatable.js',
		    requires: ['datatable', "datatable-datasource", 'yui2-button',
		    /*'datatable-events', 'datatable-sort',*/ ]
		},
		'wegas-tabview': {
		    path: 'wegas-base/js/wegas-tabview.js',
		    requires: ['tabview']
		},
		'wegas-displayarea': {
		    path: 'wegas-base/js/wegas-displayarea.js'
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
	var app = new Y.WeGAS.App(Config),
	editor = new Y.WeGAS.Editor();
	
    });
    
});