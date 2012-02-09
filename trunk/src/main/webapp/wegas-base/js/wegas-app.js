/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-app', function(Y) {
    var	CONTENT_BOX = 'contentBox',
    
    App = Y.Base.create("wegas-app", Y.Base, [ ], {
        
        dataSources: [],
        
        _rootWidgetCfg: null,
        _rootWidget: null,
	
        initializer: function(cfg){
            Y.Wegas.app = this;
	    
            this._initDataSources();
            this._initUI();
            this._initCSS();
        },
        destructor : function(){
        // TODO Delete datasources
        },
        render: function() {
            
            this._requestDataSources();
        },
	
	
        _initDataSources: function() {
            var dataSources = this.get('dataSources'),
            k;
            
            // @todo Shall we use browser native parsers
            // Y.JSON.useNativeParse = true;
                
            for (k in dataSources) {
                this.dataSources[k] = new Y.DataSource.IO(dataSources[k]);
            }
        },
        _initCSS: function() {
            var css = this.get('css'),
            i=0;
            for (; i<css.length;i++){
                Y.io(css[i]+'?id='+App.genId(), {				// Load the page css
                    timeout : 3000,
                    context: this,
                    on : {
                        success : function (x,o) {
                            this._customCSSText = o.responseText;
                            this._customCSSStyleSheet = new Y.StyleSheet(o.responseText);
                            //Y.log("RAW JSON DATA: " + o.responseText);
                            //this.updateCustomCSS(o.responseText);
                            if ( this._customCSSForm ) this._customCSSForm.inputs[0].setValue(o.responseText);
                        },
                        failure : function (x,o) {
                            Y.log("_initCSS(): Page CSS loading async call failed!", 'error', 'Wegas.App');
                        }
                    }
                })
            };
        },
        _requestDataSources: function() {
            for (var k in this.dataSources) {
                this.dataSources[k].sendRequest({
                    request: ""
                });
            }
        },
	
        _initUI: function() {
            var request = Y.io(this.get('base')+this.get('layoutSrc')+'?id='+App.genId(), {
                context: this,
                on: {
                    success: function(id, o, args) {
                        //Y.log("RedCMS.onWidgetReloadContentReceived():"+  o.responseText, 'log');
                        try {
                            this._rootWidgetCfg = Y.JSON.parse(o.responseText);				// Process the JSON data returned from the server
                        } catch (e) {
                            alert("Wegas.App._initUI(): JSON Parse failed!");
                            return;
                        }
                        this._rootWidget = Y.Wegas.Widget.create(this._rootWidgetCfg);
                        
                        try {
                            this._rootWidget.render();
                        } catch (e) {
                            Y.log('_initUI(): Error rendering UI: '+((e.stack)?e.stack:e), 'error', 'Wegas.App');
                        }
                    }
                }
            });
        }
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
            forms: {
                value: []
            },
            css: {
                value: []
            },
            currentGameModel: {},
            currentTeamId: { },
            currentUserId: { 
                setter: function(val, name) {
                    var teams = this.dataSources.Team.rest.getCachedVariables(),
                    j=0, k;
                    for (;j<teams.length;j++) {
                        for (k=0;k<teams[j].users.length;k++) {
                            if (teams[j].users[k].id == val) {
                                this.set('currentTeamId', teams[j].id);
                                return val;
                            }
                        }
                    }
                    return val;
                }
            }
        },
        genId: function() {
            var now = new Date();
            return now.getHours()+now.getMinutes()+now.getSeconds();   
        }		
    });
    
    Y.namespace('Wegas').App = App;
});