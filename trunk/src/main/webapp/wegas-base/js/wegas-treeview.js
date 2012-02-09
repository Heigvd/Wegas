/** 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-treeview', function(Y) {
    
    var CONTENTBOX = 'contentBox',
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
                YAHOO.log(node.index + " label was clicked", "info", "Wegas.WTreeView"); 
                return false;
            }, null, this); 
        },
        syncUI: function() {
        },
        
        _genVariableInstanceElements: function(label, el) {
            switch (el['@class']) {
                case 'StringVariableInstance' :
                case 'NumberVariableInstance' :
                    return {
                        type:'Text',
                        label: label+': '+el['value'],
                        title: label+': '+el['value'],
                        data: el
                    }
                    break;
                    
                case 'MCQVariableInstance' :
                    var l = label+((el.replies.length >0)?': '+el.replies[0].name:': unanswered');
                    return {
                        type:'Text',
                        label: l,
                        title: l,
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
        _genPageTreeViewElements: function(elts) {
            var type2text = {
                PMGChoiceDisplay: "Choice displayer"
            }, ret = [];
            for (var j=0; j<elts.length;j++) {
                el = elts[j];
                var text = (type2text[el.type] || el.type)+': '+(el.label || el.name || el.id || 'unnamed');
                switch (el.type) {
                    case 'List':
                        ret.push( {
                            type:'Text',
                            label:'List: '+ (el['label'] || 'unnamed'),
                            title: 'List: '+ (el['label'] || 'unnamed'), 
                            data: el,
                            children:this._genPageTreeViewElements(el.children)
                        });
                        break;
                    case 'VariableDisplay':
                        var text = 'Variable displayer: '+(el.variable);
                        ret.push( {
                            type:'Text',
                            label:text,
                            title: text, 
                            data: el
                        });
                        break;
                    case 'Text':
                        ret.push( {
                            type:'Text',
                            label: 'Text: '+el.content.substring(0, 15)+"...",
                            title: el.content, 
                            data: el
                        });
                        break;
                    case 'Button':
                        ret.push( {
                            type:'Text',
                            label:text,
                            title: text, 
                            data: el,
                            children:this._genPageTreeViewElements([el.subpage])
                        });
                        break;
                    default:
                        ret.push( {
                            type:'Text',
                            label:text,
                            title: text, 
                            data: el
                        });
                        break;
                            
                }
            }
            return ret;
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
                    case 'GameModelScope':
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
                StringVariableDescriptor: "String",
                NumberVariableDescriptor: "Number"
            }, ret = [];
            
            for (var i in elements) {
                var el = elements[i];
                
                switch (el['@class']) {
                    case 'Team':
                        ret.push( {
                            type:'Text',
                            label:'Team: '+el['name'],
                            title: 'Team: '+el['name'], 
                            expanded:false, 
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
                    case 'NumberVariableDescriptor':
                    case 'ListVariableDescriptor':
                    case 'MCQVariableDescriptor':
                        if ((this.get('includeClasses')== null) || (el['@class'] in this.get('includeClasses'))) {
                            var text = (class2text[el['@class']] || el['@class'])+': '+el['name'];
                            ret.push( {
                                type:'Text',
                                label: text,
                                title: text,
                                children: this._genScopeTreeViewElements(el),
                                data: el
                            });
                        }
                        break;
                    case 'Page':
                        var text = 'Page: '+el['label'];
                        ret.push( {
                            type:'Text',
                            label: text,
                            title: text,
                            expanded:true, 
                            children: this._genPageTreeViewElements(el.children),
                            data: el
                        });
                        break;
                        
                    case 'GameModel':
                        var text = 'Game model: '+el['name'];
                        ret.push( {
                            type:'Text',
                            label: text,
                            title: text,
                            expanded:true, 
                            children: [{
                                type:'Text',
                                label: "Game: default game",
                                title: "Game: default game",
                                expanded:true, 
                                children: this._genTreeViewElements(el.teams),
                                data: el
                            }],
                            data: el
                        });
                        break;
                        
                    default:
                        var text = (class2text[el['@class']] || el['@class'])+': '+el['name'];
                        ret.push( {
                            type:'Text',
                            label: text,
                            title: text,
                            data: el
                        });
                        break;
                }
            }
            return ret;
        }
        
    }, {
        ATTRS : {
            classTxt: {
                value: 'TreeView'
            },
            type: {
                value: "TreeView"
            },
            includeClasses: {
                value: null
            },
            dataSource: {}
        }
    });
     
    
    Y.namespace('Wegas').WTreeView = WTreeView;
});