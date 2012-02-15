/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('alba-editor', function(Y) {

	var BOUNDINGBOX = "boundingBox",
		CONTENTBOX	= "contentBox";
	
	function AlbaEditor() {};
	
	AlbaEditor.prototype = {
		
		URLSEPARATOR: '/',
		layout: null,
		tabViews: [],
		activeInput:null,
		
		init: function() {
			this.fetchData();
		},
		
		destroy: function() {
			for (var i=0; i< this.tabViews.length; i++) {
				this.tabViews[i].removeAll();
				this.tabViews[i].destroy();
			}
		},
		fetchData: function() {
			var now = new Date();
			
			this.currentGameDesign = Config.gameDesigns[Config.currentGameId];
			
			Y.io(this.currentGameDesign.dataSrc+'?id='+now.getHours()+now.getMinutes()+now.getSeconds(), {
				timeout : 3000,
				context: this,
				/*xdr: { use: 'flash', dataType: 'xml' },*/
				on : {
					success : function (x,o) {
						//Y.log("RAW JSON DATA: " + o.responseText);
						try {
							Config.data = Y.JSON.parse(o.responseText);											// Process the JSON data returned from the server
						} catch (e) {
							alert("JSON Parse failed!");
							return;
						}
						//Y.log("PARSED DATA: " + Y.Lang.dump(messages));
						
						this.initLayout();																		// Init the editor's layout
					},
					failure : function (x,o) {
						alert("Async call failed!");
					}
				}
			});
		},
		getStateById: function(id) {
			var ret;
			Y.Array.each(Config.data.stateMachines.children, function(stateMachine) {
				Y.Array.each(stateMachine.children, function(state) {
					if (state.id == id) ret = state;
				});
			});
			return ret;
		},
		getStateIndexById: function(id) {
			var transCount = 0;
			for (i in this._currentStateMachine.children) {
				if (this._currentStateMachine.children[i].id == id) return transCount;
				transCount++;
			}
		},
		getActiveStates: function() {
			var ret = [];
			Y.Array.each(Config.data.stateMachines.children, function(stateMachine) {
				Y.Array.each(stateMachine.children, function(state) {
					if (state.active) ret.push(state);
				});
			});
			return ret;
		},
		getPageWidgetCfgById: function(id) {
			var ret;
			function find(widgetCfg){
				if (widgetCfg.id == id) {
					ret = widgetCfg;
					return;
				}
				if (widgetCfg.children) {
					Y.Array.each(widgetCfg.children, find);
				}
			}
			find(this._currentPageCfg.data.pages);
			return ret;
		},
		getPageWidgetsCfgByType: function(type) {
			var ret = [];
			function find(widgetCfg){
				if (widgetCfg.type == type) ret.push(widgetCfg);
				if (widgetCfg.children) {
					Y.Array.each(widgetCfg.children, find);
				}
			}
			find(this._currentPageCfg.data.pages);
			find(this._currentPageCfg.data.subpages);
			return ret;
		},
		getSubpageById: function(id) {
			return Y.Array.find(this._currentPageCfg.data.subpages.children, function(sub) {
				return sub.id == id;
			});
		},
		getVariableById: function(id) {
			return Y.Array.find(Config.data.variables, function(el) {
				return (el.id == id);
			});
		},
		throwInputEventById: function(inputId) {
			this.throwInputEvent({id: inputId});
		},
		throwInputEvent: function(input) {
			this.activeInput = input.id;
			
			if (input.inputAction) {
				this.evalScript(input.inputAction);
			}
			this.runStateMachine();
			this.activeInput = null;
			this.synchronize();
		},
		runStateMachine: function() {
			var activeStates = this.getActiveStates(),
				modified = false;
			for (var i = 0; i< activeStates.length; i++) {
				var cState = activeStates[i];
				for (var j=0; cState.children && j < cState.children.length;j++) {
					var cTransition = cState.children[j],
						isTransitionValid = true;
						
					if (cTransition.inputTrigger) {
						isTransitionValid = cTransition.inputTrigger == this.activeInput;
					}
					
					if (cTransition.transitionCondition) {
						var ret = this.evalScript(cTransition.transitionCondition);
						isTransitionValid = isTransitionValid && ret;
					}
					
					if (isTransitionValid) {
						var nextState = this.getStateById(cTransition.nextState);
						this.transitionState(cState, nextState, cTransition);
						
						modified = true;
					}
				}
			}
			
			if (modified) {
				this.activeInput = null;
				this.runStateMachine();
			}
		},
		
		transitionState: function(srcState, targetState, transition) {
			srcState.active = false;
			targetState.active = true;
			if (srcState.exitAction) this.evalScript(srcState.exitAction);
			if (transition.transitionAction) this.evalScript(transition.transitionAction);
			if (targetState.enterAction) this.evalScript(targetState.enterAction);
		},
		
		evalScript: function(script) {
			var tmp = [],
				texts = Config.data.texts,
				cVar, i;
			Y.Array.each(Config.data.variables, function(el, counter) {													// Push current variables to context
				tmp.push(el.id+'=Config.data.variables['+counter+'].value;');
				//if (Y.Lang.isString(el.value)) 
				//	tmp.push(el.id+'="'+el.value+'";');
				//else tmp.push(el.id+'='+el.value+';');
			});
			eval(tmp.join(''));																					
				
			try {																								// Push back context to datas
				var ret = eval(script);
			} catch (ex) {
				alert("Exception evaluating user input");
			}
			
			tmp = [];																							// Push back context to datasource
			Y.Array.each(Config.data.variables, function(el, counter) {						
				tmp.push('Config.data.variables['+counter+'].value='+el.id+';');
			});
			eval(tmp.join(''));
			
			return ret;
		},
		
		synchronize: function() {
			this.variablesDataTable.load();																		// SYNC LEFT DATA TABLES
			Y.Array.each(this._currentStateMachine.children, function(el) {										// SYNC MAP
				el.container.synchronize();
			});
			this.syncPageEditorTab();																			// SYNC PREVIEW
		},
		
		initLayout: function() {
			this.layout = new YAHOO.widget.Layout({
				units: [
					{ position: 'top', height: 25, body: '', scroll: null, zIndex: 2 },
					{ position: 'left', width: 300, resize: true, scroll: true,  body: '', animate: true },			// was 550px
					{ position: 'right', width: 500, resize: true, collapse: false, scroll: true,  body: '', animate: true},
					{ position: 'center', body: '' }
				]});
				
			this.layout.on('render', function() {
				this.initTopMenu(this.layout.getUnitByPosition("top").body);									// INIT THE TOP MENU
				
				var tabviewLeftChildren = [{																	// INIT THE THREE TABVIEWS and their tabs
						label: 'Variables',
						content: '',
						toolbarButtons: [
							{ type: 'push', label: 'Add a new element', value: 'new', id: 'new' }
						]
					},  {
						label: 'Stories',
						content: '',
						toolbarButtons: [
							//{ type: 'push', label: 'Add a new element', value: 'new', id: 'new' }
						]
					},  {
						label: 'Pages',
						content: '',
						toolbarButtons: null
					},  {
						label: 'Texts',
						content: '',
						toolbarButtons: [
							//{ type: 'push', label: 'Add a new element', value: 'new', id: 'new' }
						]
					}],
					tabviewLeft = new Y.TabView({		
						defaultChildType: "AlbaEditorTab",															
						children: tabviewLeftChildren
					}),
					tabviewCenter = new Y.TabView({
						defaultChildType: "AlbaEditorTab",
						children: [
						{
							label: 'Story Editor',
							content: '',
							toolbarButtons:  [{ group: 'fontstyle', label: 'Font Name and Size',
								buttons: [
									{ type: 'push', label: 'Add a new element', value: 'new', id: 'new' },
									/*{ type: 'separator' },
									
									{ type: 'select', label: 'View', value: 'view',
										menu: [
											{ text: 'Map', checked: true },
											{ text: 'List' },
											{ text: 'Tree' }
										]
									},
									{ type: 'select', label: 'Filters', value: 'filters',
										menu: [
											{ text: 'Triggers' },
											{ text: 'Choices' },
											{ text: 'Animations' }
										]
									},
									{ type: 'separator' },
									
									{ type: 'push', label: 'Select tool', value: 'selecttool' },
									{ type: 'push', label: 'Move tool', value: 'movetool' },
									{ type: 'push', label: 'Zoom in', value: 'zoomin' },
									{ type: 'push', label: 'Zoom out', value: 'zoomout' },
									{ type: 'separator' },
									
									{ type: 'push', label: 'Cut', value: 'cut' },
									{ type: 'push', label: 'Copy', value: 'copy' },
									{ type: 'push', label: 'Paste', value: 'paste' },
									{ type: 'separator' },
									
									{ type: 'push', label: 'Start debugger', value: 'play', id: 'play' },
									{ type: 'push', label: 'Stop debugger', value: 'stop', id: 'stop' , disabled:true},
									{ type: 'separator' },
									*/
								   /*  { type: 'spin', label: '23', value: 'fontsize', range: [5, 50] }*/
								]
							}]
						},{
							label: 'Page Editor',
							content: ''
						}]
					}),
					tabviewRight = new Y.TabView({
					
						defaultChildType: "AlbaEditorTab",
						children: [{
							label: 'Edition',
							content: '<div><br /><br /><center><em>No item selected</em></center><br /><br /></div>'
						}, {
							label: 'CSS',
							content: ''
						},{
							label: 'Minimap',
							content: ''
						},{
							label: 'Log',
							content: ''
						}]
					});
					
			
				
				tabviewLeft.render(this.layout.getUnitByPosition("left").body);
				tabviewCenter.render(this.layout.getUnitByPosition("center").body);
				tabviewRight.render(this.layout.getUnitByPosition("right").body);
				this.tabViews.push(tabviewLeft, tabviewCenter, tabviewRight);
				
				//tabviewCenter.selectChild(1);
				//tabviewLeft.selectChild(1);
				
				tabviewRight.after('selectionChange', function(e, manager) {
					if (this.wireitlayer) {
						this.wireitlayer.layermap.onLayerScroll();
					}
				}, this);
				//tabviewCenter.after('selectionChange', function(e, manager) {
					/*if (this.wireitlayer) {
						this.wireitlayer.eventChanged.fire(this.wireitlayer)
					}*/
					//this.syncStateMachineTab();
				//}, this);
				tabviewRight.after('selectionChange', function() {
					this._console.collapse();
					Y.later(100, this, function() {
						this._console.expand();
					});
				}, this);
				
				this.initVariablesTab(tabviewLeft.item(0));														// Variables tab init
				this.initStatesTab(tabviewLeft.item(1).get('subpanelNode'));									// States tab init
				this.initTextsTab(tabviewLeft.item(3).get('subpanelNode'));										// Texts tab init
				
				this.initStateMachineEditorTab(tabviewCenter.item(0), tabviewRight.item(2))						// Story editor tabs initialisation
				this.initEditorTab(tabviewCenter.item(1).get('subpanelNode'));									// Page editor tab 
				
				this.initCSSEditTab(tabviewRight.item(1).get('subpanelNode'));									// CSS style editor tab
				this.initLogTab(tabviewRight.item(3));															// Log tab
				
				this.synchronize();
			}, null, this);
			
			this.layout.render(); 
		},
		
		//////////////////////////////////////////////////////////////////////LOG TAB
		_console: null,
		initLogTab: function(tab) {
			this._console = new Y.Console({ 
				logSource: Y.Global,
				//newestOnTop: false,
				plugins: [ Y.Plugin.ConsoleFilters ],
				width: '100%',
				height: '98%',
				style: 'block'
			}).render(tab.get('subpanelNode'));
		},
		
		//////////////////////////////////////////////////////////////////////PAGE EDITOR TAB
		_customCSSStyleSheet: null,
		_customCSSText: null,
		_currentPageCfg: null,
		_currentStateMachine: null,
		_editorWidget: null,
		initEditorTab: function(targetNode) {
			
			this._currentPageCfg = Config.data.pages[0];
			this._currentStateMachine = Config.data.stateMachines.children[0];
		
			var now = new Date();
			if (Config.data.pages[0]) {
				Y.io(this._currentPageCfg.uri+'?id='+now.getHours()+now.getMinutes()+now.getSeconds(), {		// Load the page widgets
					timeout : 3000,
					context: this,
					on : {
						success : function (x,o) {
							try {
								var cfg = Y.JSON.parse(o.responseText);
								this._currentPageCfg.data = cfg;
							} catch (e) {
								alert("Page JSON Parse failed!");
								return;
							}
						
							var widget = new Y[cfg.pages.children[0].type](cfg.pages.children[0]);								
							widget.plug(Y.AlbaSIM.AlbaEditorPlugin);											// Plugs the edition plugin
							widget.render(targetNode);
							this._editorWidget = widget;
							
							this.initPagesTab(this.tabViews[0].item(2).get('subpanelNode'));					// Pages tab init
						},
						failure : function (x,o) {
							alert("Page loading async call failed!");
						}
					}
				});
			}
			
			if (Config.data.cssUri) {
				Y.io(Config.data.cssUri+'?id='+now.getHours()+now.getMinutes()+now.getSeconds(), {				// Load the page css
					timeout : 3000,
					context: this,
					on : {
						success : function (x,o) {
							this._customCSSText = o.responseText;
							this._customCSSStyleSheet = new Y.StyleSheet(o.responseText);
							//Y.log("RAW JSON DATA: " + o.responseText);
							//this.updateCustomCSS(o.responseText);
							if ( this._customCSSForm ) 	this._customCSSForm.inputs[0].setValue(o.responseText);
						},
						failure : function (x,o) {
							alert("Page CSS loading async call failed!");
						}
					}
				})
			};
		},
		syncPageEditorTab: function() {
			if ( this._editorWidget ) {																			// SYNC PREVIEW
				this._editorWidget.recursiveSyncUI();
			}
		},
		
		/***************************************************************** PAGES TAB ****************************************************/
		
		initPagesTab: function(element) {
			element.append('<ul></ul>');																					// RENDER THE WIDGET
			this._pagesTabTreeview = new Y.AlbaEditorTreeView({  
				srcNode: element.one('ul'),
				children: []
			});
			this._pagesTabTreeview.render();
			this.syncPagesTab();
			
			var treebb = this._pagesTabTreeview.get(BOUNDINGBOX);														// ADD CONTEXT EVENT LISTENER
			treebb.on('contextmenu', function(e) {
				var treeEl = Y.Widget.getByNode(e.target);
				if (!treeEl) treeEl = e.target.ancestor('.yui3-widget', true)._treeview;
				if (!treeEl) return;
				
				this._editorWidget.editMenu._clearMenu();
				this._editorWidget.editMenu._setMenuItems(treeEl.get('targetVariable'));
				this._editorWidget.editMenu._showEditMenu(e);
				e.halt();
			}, this);
			
			treebb.delegate('mouseenter', function(e){
				var treeEl = Y.Widget.getByNode(e.target);
				if (!treeEl) treeEl = e.target.ancestor('.yui3-widget', true)._treeview;
				if (treeEl) {
					var targetVar = treeEl.get('targetVariable');
					if (targetVar) {
						if (!targetVar.widgetInstance) targetVar.widgetInstance = Y.AlbaSIM.AlbaManager.getWidgetByNode(Y.one('#'+targetVar.id));
						if (targetVar.widgetInstance) this._editorWidget.editMenu._showOverlay(targetVar.widgetInstance);
					}
				}
				e.halt();
			}, '.yui3-widget', this);
			
			treebb.delegate('mouseleave', function(e){
				this._editorWidget.editMenu._hideOverlay();
				e.halt();
				
				var a = e.currentTarget.get('parentNode').ancestor('.yui3-widget');
				if (a && a._treeview) {
					var targetVar = a._treeview.get('targetVariable');
					if (targetVar && targetVar.widgetInstance) this._editorWidget.editMenu._showOverlay(targetVar.widgetInstance);
				}
				//var a = Y.Widget.getByNode(e.currentTarget.get('parentNode'));
				//if (a && a.get('root') != a) this._showOverlay(a);
			}, '.yui3-widget', this);
		},

		_pagesTabTreeview: null,
		syncPagesTab: function() {
			function getTreeCfgFromWidgetCfg(cfg) {
				var ret = { 
						targetVariable: cfg,
						label: Y.AlbaSIM.albaEditor._getAdminLabel(cfg), 
						nodeType: cfg.type.toLowerCase(),
						type: 'AlbaEditorTreeLeaf',
						children: []
					};
					
				if (cfg.children) {
					ret.type = "AlbaEditorTreeView";
					Y.Array.each( cfg.children, function(child) {
						ret.children.push(getTreeCfgFromWidgetCfg(child));
					});
				}
				if (ret.children.length == 0) {
					ret.children.push({ label: "<em>This element does not have children</em>"});
				}
				return ret;
			}
			
			function getTreeCfgFromWidget(w) {
				var targetVariable = w.getAttrs(),
					ret = { 
						targetVariable: targetVariable,
						type: 'AlbaEditorTreeLeaf',
						label:  Y.AlbaSIM.albaEditor._getAdminLabel(targetVariable), 
						nodeType: w.get('type').toLowerCase(),
						children: [],
						expanded: (w instanceof Y.AlbaListWidget)
					};
				ret.targetVariable.widgetInstance = w;
					
				if (w.each && !(w instanceof Y.AlbaDisplayAreaWidget)) {
					ret.type = "AlbaEditorTreeView";
					w.each(function(child) {
						ret.children.push(getTreeCfgFromWidget(child))
					});
					if (ret.children.length == 0) {
						ret.children.push({ label: "<em>empty</em>"});
					}
				} 
				return ret;
			}
			
			if (this._pagesTabTreeview.item(0)) {																// REMOVE OUTDATED VIEWS
				this._pagesTabTreeview.item(1).destroy();
				this._pagesTabTreeview.item(0).destroy();
			}
			
			var fragmentsCfg = [];																				// ADD THE PAGES VIEW
			Y.Array.each(this._currentPageCfg.data.pages.children, function(page){
				//el.widgetInstance = Y.AlbaSIM.AlbaManager.getWidgetByNode(Y.one('#'+el.id));
				fragmentsCfg.push(getTreeCfgFromWidgetCfg(page));
			}, this);
			this._pagesTabTreeview.add({						
				label: "Pages",
				type: "AlbaEditorTreeView",
				targetVariable: this._currentPageCfg.data.pages,
				children: fragmentsCfg,
				nodeType: 'albafolder',
				expanded: true
			});
			
			var fragmentsCfg = [];																				// ADD THE SUBPAGES VIEW
			Y.Array.each(this._currentPageCfg.data.subpages.children, function(el){
				//el.widgetInstance = Y.AlbaSIM.AlbaManager.getWidgetByNode(Y.one('#'+el.id));
				fragmentsCfg.push(getTreeCfgFromWidgetCfg(el));
			}, this);
			this._pagesTabTreeview.add({
				label: 'Page fragments',
				type: "AlbaEditorTreeView",
				children: fragmentsCfg,
				targetVariable: this._currentPageCfg.data.subpages,
				nodeType: 'albafolder',
				expanded: true
			});
		},
		
		/***************************************************************** TEXTES TAB ****************************************************/
		initTableTab: function(element, columnDefs, dataSource, editionFormFields) {
			var dataTable = new YAHOO.widget.DataTable(element._node, columnDefs, dataSource, { dynamicData: true }); 
			
			dataTable.editionFormFields = editionFormFields
			/*
            dataTable.on('initEvent',function() {
				YAHOO.util.Dom.setStyle(dataTable.getTableEl(),'width','99%');
			});
			dataTable.on('columnSortEvent',function() {
				YAHOO.util.Dom.setStyle(dataTable.getTableEl(),'width','99%');
			});*/
			
	        dataTable.subscribe("cellMouseoverEvent", function(e) { 
					var elCell = e.target,
						record = this.getRecord(e.target),	
						column = this.getColumn(e.target);
					if(YAHOO.util.Dom.hasClass(elCell, "yui-dt-editable") || column.key == "inputAction") { 
						this.highlightCell(elCell); 
					} else {
						this.highlightRow(elCell);
					}
				}); 
	        dataTable.subscribe("rowMouseoutEvent", dataTable.onEventUnhighlightRow); 
	        dataTable.subscribe("cellMouseoutEvent", dataTable.onEventUnhighlightCell); 
	        dataTable.subscribe("cellClickEvent", dataTable.onEventShowCellEditor);
			
			dataTable.subscribe("cellClickEvent", function(e, manager) {
				var targetRecord = this.getRecord(e.target),
					column = this.getColumn(e.target);
					
				if (column.key == "inputAction") {
					manager.throwInputEvent(targetRecord._oData);
				}
				// SHOW EDITION TAB
				if ( this.editionFormFields) {
					manager.initEditionTab(this.editionFormFields, targetRecord._oData);
				}
			}, this);
			
			return dataTable;
		},
		
		
		initTextsTab: function(element) {
			var myColumnDefs = [
					{key:"id", sortable:true, resizeable:true},
					{key:"text", sortable:true, resizeable:true /*, editor: new YAHOO.widget.TextboxCellEditor({disableBtns:true})*/}
				], dataTable,
				textArray = [];
				
			for (var i in Config.data.texts){
				textArray.push({id: i, text: Config.data.texts[i]});
			}
			
			var myDataSource = new YAHOO.util.DataSource(textArray);
			myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			myDataSource.responseSchema = {
				fields: ["id", "text"]
			};
			dataTable = this.initTableTab(element, myColumnDefs, myDataSource, Config.formFields.AlbaText);
		},

		//////////////////////////////////////////////////////////////////////STATES TAB
		_statesTabTreeview: null,
		syncStatesTab: function() {
			function getTreeCfgFromVariable(cfg) {
				var label = cfg.name || cfg.id || '',
					ret = { 
						targetVariable: cfg,
						label: Y[cfg.type].ATTRS.classTxt.value+": "+label, 
						nodeType: cfg.type.toLowerCase(),
						type: 'AlbaEditorTreeLeaf',
						children: []
					};
					
				if (cfg.children) {
					ret.type = "AlbaEditorTreeView";
					Y.Array.some( cfg.children, function(child) {
						ret.children.push(getTreeCfgFromVariable(child));
					});
				}
				if (ret.children.length == 0) {
					ret.children.push({ label: "<em>This element does not have children</em>"});
				}
				return ret;
			}
			
			if (this._statesTabTreeview.item(0)) {																// REMOVE OUTDATED VIEWS
				this._statesTabTreeview.item(0).destroy();
			}
			
			var fragmentsCfg = [];																				// ADD THE PAGE VIEW
			Y.Array.each(Config.data.stateMachines.children, function(s) {
				fragmentsCfg.push(getTreeCfgFromVariable(s));
			});
			
			this._statesTabTreeview.add({
				targetVariable: Config.data.stateMachines,
				label: Config.data.stateMachines.name,
				type: "AlbaEditorTreeView",
				children: fragmentsCfg,
				nodeType: 'albastories',
				expanded: true
			});
		},
		initStatesTab: function(element) {
			element.append('<ul></ul>');																		// RENDER THE WIDGET
			this._statesTabTreeview = new Y.AlbaEditorTreeView({  
				srcNode: element.one('ul'),
				children: []
			});
			this._statesTabTreeview.render();
			this.syncStatesTab();
			
			var treebb = this._statesTabTreeview.get(BOUNDINGBOX);												// ADD CONTEXT EVENT LISTENER
			treebb.on('contextmenu', function(e) {
				var treeEl = Y.Widget.getByNode(e.target);
				if (!treeEl) treeEl = e.target.ancestor('.yui3-widget', true)._treeview;
				if (!treeEl) return;
				
				this._editorWidget.editMenu._clearMenu();
				this._editorWidget.editMenu._setMenuItems(treeEl.get('targetVariable'));
				this._editorWidget.editMenu._showEditMenu(e);
				e.halt();
			}, this);
			
			treebb.delegate('mouseenter', function(e){
				/*var treeEl = Y.Widget.getByNode(e.target);
				if (!treeEl) treeEl = e.target.ancestor('.yui3-widget', true)._treeview;
				if (treeEl) {
					var targetVar = treeEl.get('targetVariable');
					if (targetVar) {
						if (!targetVar.widgetInstance) targetVar.widgetInstance = Y.AlbaSIM.AlbaManager.getWidgetByNode(Y.one('#'+targetVar.id));
						if (targetVar.widgetInstance) this._editorWidget.editMenu._showOverlay(targetVar.widgetInstance);
					}
				}
				e.halt();*/
			}, '.yui3-widget', this);
			
			treebb.delegate('mouseleave', function(e){
				/*this._editorWidget.editMenu._hideOverlay();
				e.halt();
				
				var a = e.currentTarget.get('parentNode').ancestor('.yui3-widget');
				if (a && a._treeview) {
					var targetVar = a._treeview.get('targetVariable');
					if (targetVar && targetVar.widgetInstance) this._editorWidget.editMenu._showOverlay(targetVar.widgetInstance);
				}
				//var a = Y.Widget.getByNode(e.currentTarget.get('parentNode'));
				//if (a && a.get('root') != a) this._showOverlay(a);*/
			}, '.yui3-widget', this);
		},
		
		//////////////////////////////////////////////////////////////////////VARIABLES TABLE
		initVariablesTab: function(tabview) {
			var myColumnDefs = [
				{key:"id", sortable:true, resizeable:true},
				{key:"value", sortable:true, resizeable:true, editor: new YAHOO.widget.TextboxCellEditor({disableBtns:true})}
			];
			var myDataSource = new YAHOO.util.DataSource(Config.data.variables);
			myDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			myDataSource.responseSchema = {	fields: ["id","value"]	};
			this.variablesDataSource = myDataSource;
			this.variablesDataTable = this.initTableTab(tabview.get('subpanelNode'), myColumnDefs, myDataSource);
			
			
			tabview._toolbar.on('buttonClick', function(info) {														// Add variable button logic
				var _button = tabview._toolbar.getButtonByValue(info.button.value);									// We have a button reference
				
				this.initEditionTab(Config.formFields.AlbaVariable, null, function(newField) {
					Config.data.variables.push(newField);
				
					var floatValue = parseFloat(newField.value);
					if (Y.Lang.isNumber(floatValue)) 
						newField.value = floatValue;
					
					Y.AlbaSIM.albaEditor.syncVariablesTab();
				});
			}, this, true);
			
			this.variablesDataTable.subscribe('editorSaveEvent', function(e) {										// Save new variable value on inline editor save event
				this.getVariableById(e.editor._oRecord._oData.id).value = e.editor._oRecord._oData.value;
				this.syncPageEditorTab();
			}, this, true);
		},
		syncVariablesTab: function() {
			this.variablesDataTable.load();		
		},
		
		//////////////////////////////////////////////////////////////////////INITIALIZE CSS EDITION TAB	
		_customCSSForm: null,
		initCSSEditTab: function(element) {
			var manager = this;
			Y.use( "inputex", function(Y) {
				var form,
					value = manager._customCSSText || '';
				
				element.addClass('yui3-albaeditor-cssedittab-panel');
				element.empty();
				
				function showFormMsg(cssClass, msg) {															// Form msgs logic
					var msgNode = element.one('.yui3-alba-formmsg');
					if (lastCssClass) msgNode.removeClass('yui3-alba-formmsg-'+lastCssClass);
					msgNode.addClass('yui3-alba-formmsg-'+cssClass);
					msgNode.setStyle('display', 'block');
					msgNode.one('.yui3-alba-formmsg-content').setContent(msg);
					lastCssClass = cssClass;
				}
				element.append('<div class="yui3-alba-formtitle">Edit CSS</div>'
					+'<div class="yui3-alba-formmsg"><span class="yui3-alba-formmsg-icon"></span><span class="yui3-alba-formmsg-content"></span></div>');
				
				
				form = new inputEx.Form( { 
					parentEl: element._node,
					fields: [
						{ name: 'text', type:'text', rows: 30, cols: 120, value: value }
					],
					buttons: [{
						type: 'submit', 
						value: 'Update',
						onClick: function(e) { 																	// e === clickEvent (inputEx.widget.Button custom event) 
							//FIXME find a way to destroy the style sheet
							manager._customCSSStyleSheet.disable();
							manager._customCSSStyleSheet = new Y.StyleSheet(form.getValue().text);
							
							showFormMsg('success', 'CSS has been updated.');
							return false; 																		// stop clickEvent, to prevent form submitting           
				         } 
					}]
				});
				manager._customCSSForm = form;
			});
		},
		
		_getAdminLabel: function(cfg) {
			var label = (cfg.label || cfg.name || cfg.id || '');
			return Y[cfg.type].ATTRS.classTxt.value + ((label != '')?': '+label:'');
		},
		//////////////////////////////////////////////////////////////////////INITIALIZE EDITION TAB
		initEditionTab: function(formFields, values, callback) {
			Y.log("initEditionTab()", "info",  "AlbaEditor");
			var manager = this;
			Y.use( "inputex", function(Y) {
				var element = manager.tabViews[2].item(0).get('subpanelNode'),
					form, lastCssClass, label;
					
				manager.tabViews[2].selectChild(0);																// Show edition tab
				element.empty();																				// Clear the current form
					
				if (values) {																					// Sets form label
					label = 'Edit '+ manager._getAdminLabel(values);
				} else {
					var typeField = Y.Array.find(formFields, function(el) { return el.name == 'type' });
					label = 'Add '+Y[typeField.value].ATTRS.classTxt.value
				}
				
				Y.Array.each(formFields, function(field) {
					
					if (!field.typeInvite && !field.required) field.typeInvite = 'optional'; 
				
					if (field.metatype) {
						if (field.metatype == 'subpageselect') {
							field.type = 'select';
							field.choices = [ { value: null, label: 'Not selected' }];
							Y.Array.each(this._currentPageCfg.data.subpages.children, function(sub) {
								field.choices.push( { value: sub.id, label: this._getAdminLabel(sub)});
							}, this);
						}
						if (field.metatype == 'widgetselect') {
							field.type = 'select';
							field.choices = [ { value: null, label: 'Not selected' }];
							Y.Array.each(field.targetType.split(','), function(type) {
								Y.Array.each(this.getPageWidgetsCfgByType(type), function(sub) {
									field.choices.push( { value: sub.id, label: this._getAdminLabel(sub)});
								}, this);
							}, this);
						}
						
					}
				}, manager);
					
				function showFormMsg(cssClass, msg) {															// Form msgs logic
					var msgNode = element.one('.yui3-alba-formmsg');
					if (lastCssClass) msgNode.removeClass('yui3-alba-formmsg-'+lastCssClass);
					msgNode.addClass('yui3-alba-formmsg-'+cssClass);
					msgNode.setStyle('display', 'block');
					msgNode.one('.yui3-alba-formmsg-content').setContent(msg);
					lastCssClass = cssClass;
				}
				element.append('<div class="yui3-alba-formtitle">'+label+'</div>'
					+'<div class="yui3-alba-formmsg"><span class="yui3-alba-formmsg-icon"></span><span class="yui3-alba-formmsg-content"></span></div>');
				
				form = new inputEx.Form( { 
					parentEl: element._node,
					fields: formFields,
					buttons: [{
						type: 'submit', 
						value: 'Update',
						onClick: function(e) { 
							if (form.validate()) {							
								try {
									callback(form.getValue(), e);
									showFormMsg('success', 'Form submission successful.');
								} catch (e) {
									alert("Exception evaluating form callback");
								}
							} else {
								showFormMsg('error', 'Please fill all form fields correctly.');
							}
							return false; 																		// stop clickEvent, to prevent form submitting           
				         } 
					}]
				});
				
				var idFormField = form.getFieldByName('id');													// FIXME fine tune elements, should be in new objects
				if (idFormField) { if (values.id) idFormField.disable() };
				
				//FIXME hack so inputex render html area before setting values
				if (values) {
					Y.later(200, this, function() {
						form.setValue(values);
					});
				}
			});
		},
		
		/*********************************************************************** STATE MACHINE EDITOR ***********************************************/
		initStateMachineEditorTab: function(targetTab, minimapTab) {
			var manager = this;
			
			Y.use('wireit', 'alba-wireit-container', function(Y) {
		
				WireIt.Wire.prototype.remove = function() {														//HACK SO REMOVE WIRE WORKS   
					// Remove the canvas from the dom
					this.parentEl.removeChild(this.element);
			   
					// Remove the wire reference from the connected terminals
					if(this.terminal1 && this.terminal1.removeWire) {
						this.terminal1.removeWire(this);
					}
					if(this.terminal2 && this.terminal2.removeWire) {
						this.terminal2.removeWire(this);
					}

					// Remove references to old terminals
					this.terminal1 = null;
					this.terminal2 = null;

					// Remove Label
					if(this.labelEl) {
						if(this.labelField) {
							this.labelField.destroy();
						}
						var node = new Y.Node(this.labelEl);
						node.remove();
					}
				}
			
				var	currentSelectedNode,
					targetNode = targetTab.get('subpanelNode'),
					layer = new WireIt.Layer({
						parentEl: targetNode._node,
						layerMap: true,
						layerMapOptions: {
							parentEl: minimapTab.get('subpanelNode')._node
						}
					}),
					cState, cTransition, i, j, wire;
				
				manager.wireitlayer = layer;
				layer.manager = manager;
				
				layer.currentSelectedNode = null;																// MAP NODE SELECTION METHODS
				layer.selectMapNode = function(targetNode) {
					if (currentSelectedNode) {
						currentSelectedNode.removeClass("albasim-map-selected");
						if (currentSelectedNode == targetNode ) {
							currentSelectedNode = null;
							return false;
						}
					}
					targetNode.addClass("albasim-map-selected");
					currentSelectedNode = targetNode;
					return true;
				};
				
				layer.eventAddWire.subscribe( function(e, args, b) {
					var newWire = args[0];
					if (newWire.terminal2 instanceof WireIt.Terminal && !newWire.label) {
						//Y.later(50, this, function() {
						//	newWire.terminal1.removeWire(newWire);
						//});
						//this._addWire(newWire.terminal1.container.targetState, cTransition);
						
						if (!newWire.terminal1.container.targetState.children) 
							newWire.terminal1.container.targetState.children = [];
						newWire.terminal1.container.targetState.children.push({
								"type": "AlbaTransition",
								"nextState": newWire.terminal2.container.targetState.id
							});
						this.syncStateMachineTab();
					}
				}, manager, true);
				
				var layerNode = new Y.Node(layer.el);															// ADD LAYER BACKGROUND
				layerNode.append('<div class="alba-map-background"></div>');
				
				layerNode.on('contextmenu', function(e) {														// ADD CONTEXT EVENT LISTENER
					var stateNode = e.target.ancestor('.WireIt-StateContainer', true),
						transNode = e.target.ancestor('.WireIt-Wire-Label', true);
						
					this._editorWidget.editMenu._clearMenu();
					
					if (stateNode) {
						var stateContainer = Y.Array.find(this.wireitlayer.containers, function(el) {
							return el.el == stateNode._node});
						if (stateContainer) {
							this._editorWidget.editMenu._setMenuItems(stateContainer.state);
						}
					}
					if (transNode) {
						var transContainer = Y.Array.find(this.wireitlayer.wires, function(el) {
							return el.labelEl == transNode._node});
						if (transContainer) {
							this._editorWidget.editMenu._setMenuItems(transContainer.transtion);
						}
					}
					
					this._editorWidget.editMenu._setMenuItems(this._currentStateMachine);
					
					this._editorWidget.editMenu._showEditMenu(e);
					e.halt();
				}, manager);
				
				manager.syncStateMachineTab();
			});	
		},
		_addWire:function(srcStateCfg, transitionCfg) {
			var label = '', 
				srcStateIndex = this.getStateIndexById(srcStateCfg.id),
				tgtModuleIndex = this.getStateIndexById(transitionCfg.nextState),
				xtype = (tgtModuleIndex == srcStateIndex)?"WireIt.BezierArrowWire":"WireIt.ArrowWire";
			
			if (Config.data.name == "alba-laddergame") xtype = "WireIt.BezierArrowWire";				// FIXME hack for ladder game
			
			if (transitionCfg.inputTrigger && transitionCfg.inputTrigger != '') {
				label = "Triggering link: "+ transitionCfg.inputTrigger+ '<br />';
			} 						
			if (transitionCfg.transitionCondition && transitionCfg.transitionCondition != '') {
				label += "Condition: "+transitionCfg.transitionCondition;
			}
			if (label == '') label = 'not set';
			
			wire = this.wireitlayer.addWire({ 
				src: { moduleId: srcStateIndex, terminal: "out" }, 
				tgt: { moduleId: tgtModuleIndex, terminal: "in" }, 
				xtype: xtype, label: label
			});
			transitionCfg.wire = wire;
			wire.transtion = transitionCfg;
			
			/*wire.eventMouseIn.subscribe(function(e) {
				this.color = 'rgb(173, 100, 230)';
				this.redraw();
			}, wire, true);
			wire.eventMouseOut.subscribe(function(e) {
				this.color = 'rgb(173, 216, 230)';
				this.redraw();
			}, wire, true);*/
		
			//wire.eventMouseClick.subscribe(Y.bind(function(transition) {
				//this.initEditionTab( Config.formFields.transition, transition);
			//}, this, transitionCfg));
			
			var labelNode = new Y.Node(	wire.labelEl );
			//Add mouseover highlighting
			labelNode.on('mouseover', function() {
				this.addClass("albasim-map-over");
			});
			labelNode.on('mouseout', function() {
				this.removeClass("albasim-map-over");
			});
			labelNode.on('click', Y.bind(function(transition, labelNode) {
				this.wireitlayer.selectMapNode(labelNode);
				//this.initEditionTab( Config.formFields.transition, transition);
			}, this, transitionCfg, labelNode));	
		},
		syncStateMachineTab: function() {
			var width = (Config.data.name == "alba-laddergame")?50:100;											// FIXME HACK FOR BETTER DISPLAY IN PROTOTYPE
			
			this.wireitlayer.clear();																			// Clear the wireIt layer
			
			for (i in this._currentStateMachine.children) {
				cState = this._currentStateMachine.children[i];
						
				cState.container = this.wireitlayer.addContainer({
					xtype: "WireIt.StateContainer", 
					width: width,
					close: false,
					ddHandle: false,
					resizable: false,
					//draggable: true,
					title: "State #"+i,
					position: cState.position || [100, 100],
					state: cState,
					terminals: [ {		
							name: 'in',				
							wireConfig: { drawingMethod: "arrows" },											// straight, arrows, bezier, bezierArrows
							offsetPosition: [-15, 10], direction: [-0.5, 1]				
							//ddConfig: { type: "choice" }, editable: true,
						},
						{
							name: 'out',
							wireConfig: { drawingMethod: "arrows" },
							offsetPosition: {right: -15, top: 10}, direction: [0.5, 1]
						}
					]
				});
				cState.container.dd.on('endDragEvent', function(e) {
					this.position = this.container.getXY();
				}, cState, true);
			}
			
			var statesCount = 0;
			for (i in this._currentStateMachine.children) {
				cState = this._currentStateMachine.children[i];
				
				for (j=0; cState.children && j < cState.children.length; j++) {
					cTransition = cState.children[j];
					this._addWire(cState, cTransition);
				}
				statesCount++;
			}
		},
		
		/*********************************************************************** TOP MENU ***********************************************/
		initTopMenu: function(targetEl) {
			var onMenuItemClick = function () {
					alert("Callback for MenuItem: " + this.cfg.getProperty("text"));
				}, 
				ua = YAHOO.env.ua,
				oAnim, aItemData, gamesItemData = [], oItem;
			
				for (var i in Config.gameDesigns) {
					oItem = Config.gameDesigns[i];
					gamesItemData.push({text: oItem.name, url: oItem.url});
				}
				
				aItemData = [
				{ 
					text: "Game: "+this.currentGameDesign.name, 
					submenu: { 
						id: "gd", 
						itemdata: [
							[ 
								{ 
								text: "Load Game", 
									submenu: { 
										id: "applications", 
										itemdata: gamesItemData
									} 
								},
								{ text: "Game Explorer", disabled: true },
								
								//{ text: "Paste", helptext: "Ctrl + V", disabled: true,  onclick: { fn: onMenuItemClick }, keylistener: { ctrl: true, keys: 86 } },
							],
							[
								{ text: "Type Descriptors", disabled: true },
								{ text: "Variables", disabled: true },
								{ text: "Library", disabled: true },
								{ text: "Templates", disabled: true },
								{ text: "Settings", disabled: true }
							]
						]
					}
					
				},
				{text: ">>", disabled: true },
				{ 
					text: "Scenario: "+this.currentGameDesign.scenarios[0], 
					submenu: {  
						id: "filemenu", 
						itemdata: [
							[	
								{ text: "Load Scenario", disabled: true },
								{ text: "Scenario Explorer", disabled: true },
							],
							[
								{ text: "Media Library", disabled: true },
								{ text: "Settings", disabled: true }
							]
						] 
					}
				
				},
				{text: ">>", disabled: true },
				{
					text: "Instance: Debug Game", 
					submenu: { 
						id: "editmenu", 
						itemdata: [
		
							[	
								{ text: "Load Instance", disabled: true },
								{ text: "Games Explorer", disabled: true },
							],
							[ 
								{ text: "Participants", disabled: true },
								{ text: "Statistics", disabled: true },
								{ text: "Impacts", disabled: true },
								{ text: "Settings", disabled: true }
							]
					] }
				},
				{text: "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", disabled: true },
				{
					text: "Community", 
					submenu: { 
						id: "editmenu", 
						itemdata: [
							[ 
								{ text: "Users", disabled: true },
								{ text: "Group", disabled: true }
							]
					] }
				}
			];


			/*
				Instantiate a Menu:  The first argument passed to the constructor
				is the id for the Menu element to be created, the second is an 
				object literal of configuration properties.
			*/

			var oMenuBar = new YAHOO.widget.MenuBar("mymenubar", { 
				lazyload: true, 
				itemdata: aItemData,
				//autosubmenudisplay: true, 
				hidedelay: 150,
				effect: { 
					effect: YAHOO.widget.ContainerEffect.FADE,
					duration: 0.1
				}
			});


			function onSubmenuBeforeShow(p_sType, p_sArgs) {

				var oBody,
					oElement,
					oShadow,
					oUL;
				if (this.parent) {
					oElement = this.element;
					oShadow = oElement.lastChild;
					oShadow.style.height = "0px";

					if (oAnim && oAnim.isAnimated()) {
						oAnim.stop();
						oAnim = null;
					}

					oBody = this.body;
					if (this.parent && 
						!(this.parent instanceof YAHOO.widget.MenuBarItem)) {
						if (ua.gecko || ua.opera) {
							oBody.style.width = oBody.clientWidth + "px";
						}
						if (ua.ie == 7) {
							oElement.style.width = oElement.clientWidth + "px";
						}
					}

					oBody.style.overflow = "hidden";
					oUL = oBody.getElementsByTagName("ul")[0];
					oUL.style.marginTop = ("-" + oUL.offsetHeight + "px");
				}
			}

			function onTween(p_sType, p_aArgs, p_oShadow) {
				if (this.cfg.getProperty("iframe")) {
					this.syncIframe();
				}
				if (p_oShadow) {
					p_oShadow.style.height = this.element.offsetHeight + "px";
				}
			}

			function onAnimationComplete(p_sType, p_aArgs, p_oShadow) {
				var oBody = this.body,
					oUL = oBody.getElementsByTagName("ul")[0];

				if (p_oShadow) {
					p_oShadow.style.height = this.element.offsetHeight + "px";
				}
				oUL.style.marginTop = "";
				oBody.style.overflow = "";
				if (this.parent && 
					!(this.parent instanceof YAHOO.widget.MenuBarItem)) {
					if (ua.gecko || ua.opera) {
						oBody.style.width = "";
					}
					if (ua.ie == 7) {
						this.element.style.width = "";
					}
				}
			}
			
			function onSubmenuShow(p_sType, p_sArgs) {
				var oElement,
					oShadow,
					oUL;
			
				if (this.parent) {

					oElement = this.element;
					oShadow = oElement.lastChild;
					oUL = this.body.getElementsByTagName("ul")[0];
			
					oAnim = new YAHOO.util.Anim(oUL, 
						{ marginTop: { to: 0 } },
						.5, YAHOO.util.Easing.easeOut);

					oAnim.onStart.subscribe(function () {
						oShadow.style.height = "100%";
					});
					oAnim.animate();
					if (YAHOO.env.ua.ie) {
						oShadow.style.height = oElement.offsetHeight + "px";
						oAnim.onTween.subscribe(onTween, oShadow, this);
					}
					oAnim.onComplete.subscribe(onAnimationComplete, oShadow, this);
				}
			}

		   // oMenuBar.subscribe("beforeShow", onSubmenuBeforeShow);
		  //  oMenuBar.subscribe("show", onSubmenuShow);
			
			oMenuBar.render(targetEl);  
			
			menuNode = new Y.Node(oMenuBar.body);
			menuNode.addClass("yuimenubarnav");
		}
	};
	
	Y.AlbaSIM.AlbaEditor = AlbaEditor;
	
	Y.AlbaEditorTab = Y.Base.create("tab", Y.Tab , [], {
	
		_toolbar: null,
	
		_defContentSetter: function(content) {
			this.get('subpanelNode').setContent(content);
			return content;
		},
		_defContentGetter: function(content) {
			this.get('subpanelNode').getContent();
			return content;
		},
		renderUI: function () {
			Y.AlbaEditorTab.superclass.renderUI.apply(this);


			var panelNode = this.get('panelNode'),
				bb = this.get(BOUNDINGBOX),
				parentWidgetNode = this.get('parent').get(BOUNDINGBOX),
				panelHeight = parentWidgetNode.getComputedStyle('height').replace('px', '') - bb.getComputedStyle('height').replace('px', '') -17,
				subpanelHeight;
			
			parentWidgetNode.one('.yui3-tabview-panel').setStyles( {  height: panelHeight+'px' });				// Set the panel node withe the right height
			
			panelNode.append('<div class="yui3-alba-editortabtoolbar yui-editor-container"><div class="first-child"><div></div></div></div>'+
				'<div class="yui3-alba-editortab-subpanel"></div>');	
			
			this.set('subpanelNode', panelNode.one('.yui3-alba-editortab-subpanel'));
			//subpanelHeight = panelHeight - panelNode.one('.yui3-alba-editortabtoolbar').getComputedStyle('height').replace('px', '') ;
			if (this.get('toolbarButtons')) {
				this._initToolbar(panelNode.one('.yui3-alba-editortabtoolbar'));									// Init the toolbar
				
				subpanelHeight = panelHeight - 31 ;
				this.get('subpanelNode').setStyles({height: subpanelHeight+"px"});								// Set the subpanel node withe the right height
			} else {
				panelNode.one('.yui3-alba-editortabtoolbar').setStyle('display', 'none');
			}
		},
		//syncUI: function() {
		//}	
		_initToolbar: function(targetNode) {
			this._toolbar = new YAHOO.widget.Toolbar(targetNode._node.firstChild.firstChild, {
				buttonType: 'advanced',
				draggable: false,
				//buttonType:, collapse:, cont:, disabled:,  grouplabels:, titlebar: "test",
				buttons: this.get('toolbarButtons')
			});
			//toolbar.on('buttonClick', function(info) {
				//var _button = toolbar.getButtonByValue(info.button.value);									// We have a button reference	
			   // toolbar.deselectAllButtons();
				//toolbar.selectButton(_button);
			   // status.innerHTML = 'You clicked on ' + _button.get('label') + ', with the value of ' + ((info.button.color) ? '#' + info.button.color + ' : ' + info.button.colorName : info.button.value);
			//});
		}
	}, {
		ATTRS : {
			subpanelNode: {	},
			toolbarButtons: { }
		}
	});
	var getClassName = Y.ClassNameManager.getClassName,
        TREEVIEW = 'treeview',
        TREE = 'tree',
        TREELEAF = 'treeleaf',
        classNames = {
            loading : getClassName(TREEVIEW,'loading'),
            tree : getClassName(TREE),
            treeLabel : getClassName(TREEVIEW,"treelabel"),
            labelcontent : getClassName(TREEVIEW,'label-content'),
            treeview : getClassName(TREEVIEW),
            collapsed : getClassName(TREE,"collapsed"),
            leaf : getClassName(TREELEAF)
        };
		
	Y.AlbaEditorTreeView = Y.Base.create("treeview", Y.TreeView, [], {
			/*initializer : function (config) {
				Y.AlbaEditorTreeView.superclass.initializer.apply(this, arguments);
			},*/
			renderUI: function() {
				Y.AlbaEditorTreeView.superclass.renderUI.apply(this);
				
				var bb = this.get(BOUNDINGBOX),
					labelNode = bb.one('span');
				bb._treeview = this;
				
				if (this.get('nodeType')) {
					bb.addClass(this.getClassName(this.get('nodeType')));
				}
				if (labelNode) labelNode.setContent('<span class="'+this.getClassName('icon')+'" ></span><span class="'+this.getClassName('labeltxt')+'">'+this.get('label')+'</span>');
				
				if (this.get('expanded')) {
					var bb = this.get(BOUNDINGBOX);
					bb.removeClass('yui3-tree-collapsed');
				}
			},
			bindUI: function() {
				//Y.AlbaEditorTreeView.superclass.bindUI.apply(this);
				
				//From tree view class
				if (this.isRoot()) {
					boundingBox = this.get(BOUNDINGBOX);
					contentBox = this.get(CONTENTBOX);
					boundingBox.on("click",this.onViewEvents,this);
					boundingBox.on("keydown",this.onViewEvents,this);
					/*boundingBox.plug(Y.Plugin.NodeFocusManager, {
						descendants: ".yui3-treeleaf-labeltxt, .yui3-treeview-labeltxt",
						keys: {
							next: "down:40",    // Down arrow
							previous: "down:38" // Up arrow 
						},
						circular: true
					});*/
				}
				
				if (this.isRoot()) {
					this.on("treeview:click", function(event, a, b) {
						console.log("mmm");
						event.target.set('selected', 1);
					});
					
					this.on("treeleaf:click", function(event, a, b) {
						event.target.set('selected', 1);
					});
				}
				
				this.after('selectedChange', this._afterTabSelectedChange);
			},
			/*
			onViewEvents : function (event) {
				var target = event.target,
					keycode = event.keyCode,
					classes,
					className,
					i,
					cLength;
				
				classes = target.get("className").split(" ");
				cLength = classes.length;
				cLength = classes.length;
				
				//event.preventDefault();
				
				
				for (i=0;i<cLength;i++) {
					className = classes[i];
					switch (className) {
						case classNames.labelcontent :
							this.fire('toggleTreeState',{actionNode:target});
							break;
						case classNames.treeLabel :
							if (keycode === 39) {
								this._expandTree(target);
							} else if (keycode === 37) {
								this._collapseTree(target);
							}
							break;
					}
				}
			},*/
			
			_uiSetFocused: function(val, src) {
				return;
			},
			
			_uiSetSelectedTreeLeaf: function(selected) {
				this.get(CONTENTBOX).toggleClass("selected", selected);
			},

			_afterTabSelectedChange: function(event) {
			   this._uiSetSelectedTreeLeaf(event.newVal);
			},
			/*syncUI: function() {
			
				Y.AlbaEditorTreeView.superclass.syncUI.apply(this);
			}*/
		}, {
		ATTRS : {
			nodeType: {},
			targetVariable: { },
			expanded: {
				value: false
			}
		}
	});
	Y.AlbaEditorTreeLeaf = Y.Base.create("treeleaf", Y.TreeLeaf, [], {
			bindUI: function() {
				Y.AlbaEditorTreeLeaf.superclass.bindUI.apply(this);
			
				var bb = this.get(BOUNDINGBOX);
				
				if (this.get('nodeType')) {
					bb.addClass(this.getClassName(this.get('nodeType')));
				}
				bb.one("span").setContent('<span class="'+this.getClassName('icon')+'" ></span><span class="'+this.getClassName('labeltxt')+'">'+this.get('label')+'</span>');
				
				this.after('selectedChange', this._afterTabSelectedChange);
			},
			
			_uiSetFocused: function(val, src) {
				return;
			},
			_uiSetSelectedTreeLeaf: function(selected) {
				this.get(CONTENTBOX).toggleClass("selected", selected);
			},

			_afterTabSelectedChange: function(event) {
			   this._uiSetSelectedTreeLeaf(event.newVal);
			},
		}, {
		ATTRS : {
			nodeType: {},
			targetVariable: {	}
		}
	});
});
	
	