/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/
var YAHOO,
	Y = YUI({
	//lang: 'en-US',
	//timeout: 10000,
	filter: 'raw',
	filters: { widget: 'debug', base: 'debug' },
	//logInclude = { node: true },
	//logExclude = { attribute: true },
	//combine: false,
   	//debug: Config.debug,
	charset: 'utf-8',
	loadOptional: true,
    useBrowserConsole: true,
    insertBefore: 'customstyles', 
    gallery: 'gallery-2011.02.18-23-10',
	yui2: '2.9.0',
	groups: {
		albasim: {
			combine: false,
			//base: Config.path,
			base: "src/",
			//comboBase: Config.path+'combo/?',
			root: 'rr',
			modules:  {
				// *** BASE MODULES *** //
				'alba-manager': {
					path: 'alba-base/js/alba-manager.js',
					requires: ['alba-widget', 'io', 'json-parse', 'alba-listwidget' ]
				},
				'alba-widget': {
					path: 'alba-base/js/alba-widget.js',
					requires: ["node", 'widget', 'widget-stdmod', "widget-position", "widget-stack", "widget-position-align", "async-queue", "escape", 'plugin']
				},
				'alba-wireit-container': {
					path: 'alba-admin/js/alba-wireit-container.js',
					requires: ['wireit', 'gallery-outside-events']
				},
				'alba-listwidget': {
					path: 'alba-base/js/alba-listwidget.js',
					requires: ["substitute", "widget", "widget-parent", "widget-child", "node-focusmanager", "tabview"]
				},
				'alba-editor': {
					path: 'alba-admin/js/alba-editor.js',
					requires: ['alba-widget', 'alba-pageeditor', 'stylesheet', 'gallery-yui3treeview', 'array-extras', 'console', 'console-filters',
						'yui2-menu', 'yui2-layout', 'yui2-editor', 'yui2-utilities', 'yui2-container', 'yui2-json', 'yui2-datatable', 'tabview']
				},
				'alba-pageeditor': {
					path: 'alba-admin/js/alba-pageeditor.js',
					requires: ['widget', 'widget-position', 'widget-stack', 'dd-constrain', 'sortable', 'gallery-outside-events']
				}
			}
		},
		inputex: {
			combine: false,
			//base: Config.path,
			base: "lib/inputex/",
			//comboBase: Config.path+'combo/?',
			//root: 'rr',
			modules:  {
				// *** BASE MODULES *** //	
				'inputex-loader': {
					path: 'js/yui3-loader.js',
				},
				'inputex': {
					path: 'build/inputex-min.js',
				}
			}
		},
		wireit: {
			combine: false,
			//base: Config.path,
			base: "lib/wireit/",
			//comboBase: Config.path+'combo/?',
			root: 'dd',
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
/*				'wireit': {
					//path: 'build/wireit.js',
					path: 'js/WireIt.js',
					requires: ["yui2-utilities", 'excanvas']
				},*/
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
		}
	}  
}).use('alba-manager', 'alba-editor',  function (Y) {

	YAHOO = Y.YUI2;																// Backward compatibility w/ wireit and inputex v0.5
	Y.namespace('AlbaSIM').Config = Config;										// Use current config

	Y.on('domready', function() {
		Config.currentGameId = currentGameId;
		
		Y.AlbaSIM.albaManager = new Y.AlbaSIM.AlbaManager();									// Instantiate the data manager
		Y.AlbaSIM.albaEditor = new Y.AlbaSIM.AlbaEditor();
		Y.AlbaSIM.albaEditor.init();
    });
});