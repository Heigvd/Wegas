/** 
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('alba-manager', function(Y) {
	var BOUNDINGBOX = 'boundingBox';
	
	function AlbaManager() {
		AlbaManager.superclass.constructor.apply(this, arguments);
		/*return { 
			
		};*/
	}
	AlbaManager.NAME = "alba-manager";
	AlbaManager.ATTRS = {
		//close : { ... },
		//minimize : { ... },
		//shadow : { ... }
	};
	Y.extend(AlbaManager, Y.Base, {
		/*
		getLink : function() {
			return conf.path+
				//conf.lang+URLSEPARATOR+
				Array.prototype.join.call(arguments, URLSEPARATOR)+URLSEPARATOR;
		},
		getParentBlock : function(n) {
			return n.ancestor( function(e) {
				return  (e.getAttribute('redid') != '');
			});
		},
		getParentAdminBlock : function(n) {
			return n.ancestor( function(e) {
				return  (e.getAttribute('redadmin') != '');
			});
		},
		reloadWidget : function(widget) {
			var cb = widget.get('contentBox'),
				bb = widget.get('boundingBox'),
				request,
				requestData = {'redreload':true};
			
				if (cb.getAttribute('redparams') != ''){
					bParams = Y.JSON.parse(cb.getAttribute('redparams'));
					requestData = Y.merge( requestData, bParams);
				}
				widget.showReloadOverlay();
				request = Y.io(Y.RedCMS.RedCMSManager.getLink(cb.getAttribute("redid")), {
					data: requestData,
					on: {
						success: function(id, o, args) {
						//	Y.log("RedCMS.onWidgetReloadContentReceived():"+  o.responseText, 'log');
			
							var newNode = Y.Node.create( o.responseText );
							bb.replace(newNode);
							Y.RedCMS.RedCMSManager.render(newNode, Y.bind(function(widgets){
								this.fire('reload', widgets);
								this.destroy();
							}, widget));
						}
					}
				});
		},*/
		renderWidget : function(node) {
			//Y.log('RedCMSManager.renderWidget(): ' + node.getAttribute('widget'));
			try {
				var config = node.getAttribute('config');
				if (config) config = Y.JSON.parse(this.decodeAttribute(config));
				else config = {};
				config.srcNode = node;
				config.render = true; 
				widget = new Y.AlbaSIM[node.getAttribute('widget')](config);
				return widget;
			} catch (e) {
				Y.log('Error creating widget with class: Y.RedCMS.'+node.getAttribute('widget'), 'error', 'RedCMSManager');
			}
		},
		renderWidgets : function(widgetNodes, fn, Y) {
			//console.log('RedCMSManager.renderWidgets:', widgetNodes);
			var widgets = [];
			widgetNodes.some(function(node){
				var newWidget = this.renderWidget(node);
				if (newWidget) widgets.push(newWidget);
			}, this);
			if (fn != undefined) {
				fn(widgets);
			}
		},
		render : function(node, fn){
			var widgets = node.all('.as-widget'),
				requires = [];
				
			//if (node.test('[widget]')) widgets.push(node);
			//Y.log("RedCMSManager.render()", 'log', 'RedCMS.RedCMSManager');
			//widgets.some(function(n){
			//	var r = n.getAttribute('requires');
			//	if (r) requires.push(r);
			//});

			if (requires.length>0){
				//requires.push(Y.bind(this.renderWidgets, this, widgets, fn));
				//Y.use.apply(Y, requires);
			}else {
				this.renderWidgets(widgets, fn);
			}
		}
	}, {
		urldecode : function(psEncodeString) {
			// Create a regular expression to search all +s in the string
			var lsRegExp = /\+/g;
			// Return the decoded string
			return unescape(String(psEncodeString).replace(lsRegExp, " "));
		},
		escapeAttribute: function(text) {
			if(text) {
				text += "";
				return text.replace(/"/g, "&quot;");
			}
			return "";
		},
		decodeAttribute: function(att) {
			return att.replace("&quot;", "\"");
		},
		getWidgetByNode: function(target) {
			var cWidget = Y.Widget.getByNode(target); 
			while (cWidget) {
				if (cWidget.get('type')) return cWidget;
				cWidget = Y.Widget.getByNode(cWidget = cWidget.get(BOUNDINGBOX).get('parentNode'));
			}
			return null;
		}
	});

	Y.namespace('AlbaSIM').AlbaManager = AlbaManager;
});
