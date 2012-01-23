/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-app', function(Y) {
    var	CONTENT_BOX = 'contentBox',
    Lang = Y.Lang,
    
    App = Y.Base.create("wegas-app", Y.Base, [ ], {
	
        initializer: function(cfg){
            Y.WeGAS.app = this;
	    
            this._initDataSources();
            this._initUI();
        },
        destructor : function(){
        },
	
	
        _initDataSources: function() {
            var dataSources = this.get('dataSources');
            this.dataSources = [];
            for (var k in dataSources) {
                // Y.JSON.useNativeParse = true;
                var ds = new Y.DataSource.IO(dataSources[k]);
                ds.plug(Y.Plugin.DataSourceREST);
                this.dataSources[k] = ds;
            }
            
            this.dataSources.User.sendRequest({
                request: "/"
            });
        },
	
        _rootWidgetCfg: null,
        _rootWidget: null,
        _initUI: function() {
            var request = Y.io(this.get('base')+this.get('layoutSrc')+'?id='+App.genId(), {
                context: this,
                on: {
                    success: function(id, o, args) {
                        //Y.log("RedCMS.onWidgetReloadContentReceived():"+  o.responseText, 'log');
                        try {
                            this._rootWidgetCfg = Y.JSON.parse(o.responseText);				// Process the JSON data returned from the server
                        } catch (e) {
                            alert("WeGAS.App._initUI(): JSON Parse failed!");
                            return;
                        }
                        this._rootWidget = Y.WeGAS.Widget.create(this._rootWidgetCfg);
                        
                        try {
                            this._rootWidget.render();
                        } catch (exception) {
                            console.log(exception);
                            Y.log('Error rendering UI', 'error', 'base');
                        }
                    }
                }
            });
        }
	
	
    /////////////////////HACK Those are temporary helpers, to be removed
	
	
    }, {
        ATTRS: {
            /**
		 * Base url for app
		 */
            base: { },
            layoutSrc: {},
            dataSources: {
                value: {}
            },
	    
            // FIXME temporary attributes, to be removed in future versions
            forms :{},
            adminMenus: {},
            currentGameModel: {}
        },
        genId: function() {
            var now = new Date();
            return now.getHours()+now.getMinutes()+now.getSeconds();   
        }		
    });
    
    Y.namespace('WeGAS').App = App;
});