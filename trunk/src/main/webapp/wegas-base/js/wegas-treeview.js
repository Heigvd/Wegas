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
        },
        syncUI: function() {
        },
        
        _genVariableInstanceElements: function(label, el) {
            switch (el['@class']) {
                case 'StringVariableInstance' :
                    return {
                        type:'Text',
                        label: label+': '+el['content'],
                        title: label+': '+el['content'],
                        data: el
                    }
                    break;
                    
                case 'MCQVariableInstance' :
                    return {
                        type:'Text',
                        label: label+': not replied',
                        title: label+': not replied',
                        data: el
                    }
                    break;
                default:
                    return {
                        type:'Text',
                        label: label,
                        title: label,
                        data: el
                    }
                    break;
                    
            }
        },
        _genScopeTreeViewElements: function(el) {
            var children=[];
            for (var j in el.scope.variableInstances) {
                subEl = el.scope.variableInstances[j];
                var label = '';
                switch (el.scope['@class'] ) {
                    case 'UserScope':
                        var user = Y.Wegas.app.dataSources.User.rest.getCachedVariableById(j);
                        label = user.name;
                        break;
                    case 'TeamScope':
                        var team = Y.Wegas.app.dataSources.Team.rest.getCachedVariableById(j);
                        label = team.name;
                        break;
                    case 'GameScope':
                        label = 'Global';
                        break;
                }
                children.push(this._genVariableInstanceElements(label, subEl));
            }
            return children;
        },
        _genTreeViewElements: function(elements) {
            var class2text = {
                MCQVariableDescriptor: "Choice",
                StringVariableDescriptor: "String"
            }, ret = [];
            
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
                    case 'ListVariableDescriptor':
                    default:
                        
                        if (el['@class'] in this.get('includeClasses')) {
                            var text = (class2text[el['@class']] || el['@class'])+': '+el['name'];
                            ret.push( {
                                type:'Text',
                                label: text,
                                title: text,
                                expanded:false, 
                                children: this._genScopeTreeViewElements(el),
                                data: el
                            });
                        }
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
            includeClasses: {
                value: {}
            },
            rootClass: {},
            dataSource: {}
        }
    });
     
    
    Y.namespace('Wegas').WTreeView = WTreeView;
});