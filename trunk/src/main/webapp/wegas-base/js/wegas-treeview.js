/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-treeview', function(Y) {
    
    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'contentBox',
    YAHOO = Y.YUI2,
    WTreeView = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.WeGAS.Widget], {
	
        _dataSource: null,
        _pushButton: null,
        _treeView: null,
	
        initializer: function(cfg) {
            this._dataSource = Y.WeGAS.app.dataSources[this.get('dataSource')];
        },
        destroyer: function() {
            this._treeView.destroy();
        },
	
        renderUI: function () {  
            var cb = this.get(CONTENTBOX),
            el = new Y.Node.create('<div></div>');
                
            cb.appendChild(el);
            
            this._treeView = new YAHOO.widget.TreeView(el._node,[]);
            this._treeView.render();
            
            this._pushButton = new YAHOO.widget.Button({			//Instantiate the "New" button
                label:"New "+this.get('rootClass'), 
                container:cb._node
            });
            
        },
        
        _genTreeViewElements: function(elements) {
            var ret = [];
            for (var i in elements) {
                var el = elements[i];
                
                switch (el['@class']) {
                    case 'Team':
                        ret.push( {
                            type:'Text',
                            label:'Team: '+el['name'],
                            title: 'Team: '+el['name'], 
                            expanded:true, 
                            children: this._genTreeViewElements(el.users),
                            data: el
                        })
                        break;
                    case 'User':
                        ret.push( {
                            type:'Text',
                            label:'User: '+el['name'],
                            title: 'User: '+el['name'],
                            data: el
                        })
                        break;
                    case 'StringVariableDescriptor':
                        ret.push( {
                            type:'Text',
                            label: 'Variable: '+el['name'],
                            title: 'Variable: '+el['name'],
                            expanded:true, 
                            children: this._genTreeViewElements(el.scope.variableInstances),
                            data: el
                        });
                        break;
                    case 'StringVariableInstance':
                        var user = Y.WeGAS.app.dataSources.User.rest.getCachedItem(i);
                        ret.push( {
                            type:'Text',
                            label: user.name+': '+el['content'],
                            title: user.name+': '+el['content'],
                            data: el
                        });
                        break;
                }
            }
            return ret;
        },
        
        bindUI: function() {
            
            this._dataSource.after("response", function(e) {			// Listen for datasource updates
                console.log("response from data source")
                if (e.response.results && ! e.response.error) {
                    var treeViewElements = this._genTreeViewElements(e.response.results);
                    this._treeView.removeChildren(this._treeView.getRoot());
                    this._treeView.buildTreeFromObject(treeViewElements);
                    this._treeView.render();
                };
            }, this);
	   
            this._dataSource.sendRequest({
                request: "/"
            });
            this._treeView.subscribe("clickEvent", function() {
                return false;
            });
            
            this._treeView.subscribe("labelClick", function(node) { 
                Y.WeGAS.editor.edit(node.data, function(cfg) {
                    this._dataSource.rest.put(cfg);
                }, null, this);
                YAHOO.log(node.index + " label was clicked", "info", "example"); 
                return false;
            }, null, this); 
            
            this._pushButton.on("click", function() {				// New button click event
                Y.WeGAS.editor.edit({
                    "@class": this.get('rootClass')
                }, function(cfg) {
                    this._dataSource.rest.post(cfg);
                }, null, this);
            }, null, this);
	  
        },
        syncUI: function() {
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'rootClass'
            },
            type: {
                value: "TreeView"
            },
            rootClass: {},
            dataSource: {}
        }
    });
     
    
    Y.namespace('WeGAS').WTreeView = WTreeView;
});