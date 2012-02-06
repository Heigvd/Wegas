/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-variabledisplay', function(Y) {
    
    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    YAHOO = Y.YUI2,
    VariableDisplay = Y.Base.create("wegas-variabledisplay", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
	
        _dataSource: null,
	
        initializer: function(cfg) {
            this._dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
        },
        destroyer: function() {
            
        },
	
        renderUI: function () {  
            
        },
        
        bindUI: function() {
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", function(e) {
                this.syncUI();
            }, this);
            Y.Wegas.app.after('currentUserIdChange', function(e) {
                this.syncUI();
            }, this);
        },
        syncUI: function() {
            var val = this._dataSource.rest.getInstanceBy('name', this.get("variable")) || "undefined";
            switch (this.get('view'))  {
                case 'text':
                    this.get(CONTENTBOX).setContent(this.get('label')+": "+val.value);
                    break;
                case 'box':
                    break;
                
            }
        /*
            Y.AlbaVariableWidget.superclass.syncUI.apply(this, arguments);
            var evaluatedResult = Y.AlbaSIM.albaEditor.evalScript(this.get("variable"));

            if ( this.get('view') == 'text') {
                this.get(CONTENTBOX).setContent(this.get('label')+": "+evaluatedResult);
            } else {
                var acc =[];
                for (var i=0; i<evaluatedResult; i++) {
                    acc.push('<div class="yui3-alba-variablewidget-unit"></div>');
                }
                this.get(CONTENTBOX).setContent(this.get('label')+": <br />"+acc.join('')+'('+evaluatedResult+')');
            }*/
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'VariableDisplay'
            },
            type: {
                value: "VariableDisplay"
            },
            dataSource: {},
            label : {
                validator: Y.Lang.isString
            },
            variable: { },
            view: {
                value: "text"
            }
        }
    });
    
    Y.namespace('Wegas').VariableDisplay = VariableDisplay;
});