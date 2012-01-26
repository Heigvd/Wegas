/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-treeview', function(Y) {
    
    var CONTENTBOX = 'contentBox',
    BOUNDINGBOX = 'boundingBox',
    YAHOO = Y.YUI2,
    WTreeView = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
	
        _dataSource: null,
        _pushButton: null,
        _treeView: null,
	
        initializer: function(cfg) {
            this._dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
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
        
        bindUI: function() {
            
            this._dataSource.after("response", function(e) {			// Listen for datasource updates
                if (e.response.results && ! e.response.error) {
                    var treeViewElements = this._genTreeViewElements(e.response.results);
                    this._treeView.removeChildren(this._treeView.getRoot());
                    this._treeView.buildTreeFromObject(treeViewElements);
                    this._treeView.render();
                };
            }, this);
	   
            this._treeView.subscribe("clickEvent", function() {
                return false;
            });
            
            this._treeView.subscribe("labelClick", function(node) { 
                Y.Wegas.editor.edit(node.data, function(cfg) {
                    this._dataSource.rest.put(cfg);
                }, null, this);
                YAHOO.log(node.index + " label was clicked", "info", "example"); 
                return false;
            }, null, this); 
            
            this._pushButton.on("click", function() {				// New button click event
                Y.Wegas.editor.edit({
                    "@class": this.get('rootClass')
                }, function(cfg) {
                    this._dataSource.rest.post(cfg);
                }, null, this);
            }, null, this);
	  
        },
        syncUI: function() {
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
                        
                        var children = [];
                     
                        for (var j in el.scope.variableInstances) {
                            subEl = el.scope.variableInstances[j];
                                
                            switch (el.scope['@class'] ) {
                                case 'UserScope':
                                    var user = Y.Wegas.app.dataSources.User.rest.getCachedVariableById(j);
                                    children.push({
                                        type:'Text',
                                        label: user.name+': '+subEl['content'],
                                        title: user.name+': '+subEl['content'],
                                        data: subEl
                                    });
                                    break;
                                case 'TeamScope':
                                    var team = Y.Wegas.app.dataSources.Team.rest.getCachedVariableById(j);
                                    children.push({
                                        type:'Text',
                                        label: team.name+': '+subEl['content'],
                                        title: team.name+': '+subEl['content'],
                                        data: subEl
                                    });
                                    break;
                                case 'GameScope':
                                    children.push({
                                        type:'Text',
                                        label: 'value: '+subEl['content'],
                                        title: 'value: '+subEl['content'],
                                        data: subEl
                                    });
                                    break;
                            }
                        }
                        ret.push( {
                            type:'Text',
                            label: 'Variable: '+el['name'],
                            title: 'Variable: '+el['name'],
                            expanded:true, 
                            children: children,
                            data: el
                        });
                        break;
                /* case 'StringVariableInstance':
                        var user = Y.Wegas.app.dataSources.User.rest.getCachedVariableById(i);
                        
                        ret.push( {
                            type:'Text',
                            label: user.name+': '+el['content'],
                            title: user.name+': '+el['content'],
                            data: el
                        });
                        break;*/
                }
            }
            return ret;
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
     
    
    Y.namespace('Wegas').WTreeView = WTreeView;
});