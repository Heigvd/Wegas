/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */



YUI.add('wegas-treeview', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', WTreeView,
        YAHOO = Y.YUI2,
        EDITBUTTONTPL = "<span class=\"yui3-wegas-treeview-editmenubutton\"></span>";

    WTreeView = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        _dataSource: null,
        _pushButton: null,
        _treeView: null,

        initializer: function () {
            this._dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
        },

        renderUI: function () {
            var node = this.get(CONTENTBOX).append('<div></div>');

            // Render YUI2 TreeView widget
            this._treeView = new YAHOO.widget.TreeView(node._node);
            this._treeView.singleNodeHighlight = true;
            this._treeView.render();
        },

        bindUI: function () {
            // Listen updates on the target datasource
            this._dataSource.after("response", function (e) {
                if (e.response.results && !e.response.error) {
                    var treeViewElements = this.genTreeViewElements(e.response.results);
                    this._treeView.removeChildren(this._treeView.getRoot());
                    this._treeView.buildTreeFromObject(treeViewElements);
                    this._treeView.render();
                }
            }, this);

            // When a leaf is clicked
            this._treeView.subscribe("clickEvent", function (e) {
                YAHOO.log(e.node.index + " label was clicked", "info", "Wegas.WTreeView");
                // Either show the edit menu
                if (e.event.target.className === "yui3-wegas-treeview-editmenubutton") {
                    Y.Wegas.editor.showEditMenu(e.node.data, this._dataSource);
                    Y.Wegas.editor._editMenu.get("boundingBox").appendTo(e.event.target.parentNode);
                    Y.Wegas.editor._editMenu.set("align", {
                        node: e.event.target,
                        points: ["tr", "br"]
                    });
                // Or display the edit tab
                } else {
                    Y.Wegas.editor.edit(e.node.data, function (cfg) {
                        this._dataSource.rest.put(cfg);
                    }, null, this);
                }
            }, null, this);

            // Turn tree element selection on
            this._treeView.subscribe('clickEvent', this._treeView.onEventToggleHighlight);

            // Hide the menu as soon as user mouses out
            this.get(CONTENTBOX).delegate('mouseleave', Y.Wegas.editor._editMenu.hide, '.ygtvrow');
        },

        syncUI: function () {
        },

        destroyer: function () {
            this._treeView.destroy();
        },

        genVariableInstanceElements: function (label, el) {
            switch (el['@class']) {
            case 'StringVariableInstance':
            case 'NumberVariableInstance':
                return {
                    label: label + ': ' + el.value,
                    title: label + ': ' + el.value,
                    data: el
                };

            case 'MCQVariableInstance':
                var l = label + ((el.replies.length > 0) ? ': ' + el.replies[0].name : ': unanswered');
                return {
                    type: 'Text',
                    label: l,
                    title: l,
                    data: el
                };

            case 'InboxInstance':
                var k, children = [];

                label += "(" + el.messages.length + ")";

                for (k = 0; k < el.messages.length; k += 1) {
                    children.push({
                        type: 'Text',
                        label: el.messages[k].subject,
                        title: el.messages[k].subject
                    });
                }
                return {
                    type: 'Text',
                    label: label,
                    title: label,
                    data: el,
                    children: children
                };

            default:
                return {
                    type: 'Text',
                    label: label,
                    title: label,
                    data: el
                };
            }
        },

        genPageTreeViewElements: function (elts) {
            var ret = [], j, text, el,
                type2text = {
                    PMGChoiceDisplay: "Choice displayer"
                };

            for (j = 0; j < elts.length; j += 1) {
                el = elts[j];
                text = (type2text[el.type] || el.type) + ': ' + (el.label || el.name || el.id || 'unnamed');
                switch (el.type) {
                case 'List':
                    ret.push({
                        type: 'Text',
                        label: 'List: ' + (el.label || 'unnamed'),
                        title: 'List: ' + (el.label || 'unnamed'),
                        data: el,
                        children: this.genPageTreeViewElements(el.children)
                    });
                    break;
                case 'VariableDisplay':
                    text = 'Variable displayer: ' + (el.variable);
                    ret.push({
                        type: 'Text',
                        label: text,
                        title: text,
                        data: el
                    });
                    break;
                case 'Text':
                    ret.push({
                        type: 'Text',
                        label: 'Text: ' + el.content.substring(0, 15) + "...",
                        title: el.content,
                        data: el
                    });
                    break;
                case 'Button':
                    ret.push({
                        type: 'Text',
                        label: text,
                        title: text,
                        data: el,
                        children: (el.subpage) ? this.genPageTreeViewElements([el.subpage]) : []
                    });
                    break;
                default:
                    ret.push({
                        type: 'Text',
                        label: text,
                        title: text,
                        data: el
                    });
                    break;

                }
            }
            return ret;
        },
        genScopeTreeViewElements: function (el) {
            var children = [], i, label, team, player, subEl;

            for (i in el.scope.variableInstances) {
                if (el.scope.variableInstances.hasOwnProperty(i)) {
                    subEl = el.scope.variableInstances[i];
                    label = '';
                    switch (el.scope['@class']) {
                    case 'PlayerScope':
                        player = Y.Wegas.app.dataSources.Game.rest.getPlayerById(i);
                        label = (player) ? player.name : "undefined";
                        break;
                    case 'TeamScope':
                        team = Y.Wegas.app.dataSources.Game.rest.getTeamById(i);
                        label = (team) ? team.name : "undefined";
                        break;
                    case 'GameModelScope':
                        label = 'Global';
                        break;
                    }
                    children.push(this.genVariableInstanceElements(label, subEl));
                }
            }
            return children;
        },
        genTreeViewElements: function (elements) {
            var class2text = {
                MCQVariableDescriptor: "Choice",
                StringVariableDescriptor: "String",
                NumberVariableDescriptor: "Number"
            }, ret = [], i, el, text;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];

                    switch (el['@class']) {
                    case 'StringVariableDescriptor':
                    case 'NumberVariableDescriptor':
                    case 'ListVariableDescriptor':
                    case 'MCQVariableDescriptor':
                    case 'InboxDescriptor':

                        if ((this.get("excludeClasses") === null
                                || !this.get('excludeClasses').hasOwnProperty(el['@class']))
                                && (this.get('includeClasses') === null
                                || this.get('includeClasses').hasOwnProperty(el['@class']))) {

                            text = (class2text[el['@class']] || el['@class']) + ': ' + el.name;
                            ret.push({
                                type: 'html',
                                html: text + EDITBUTTONTPL,
                                title: text,
                                children: this.genScopeTreeViewElements(el),
                                data: el,
                                contentStyle: this.getClassName('icon-game')
                            });
                        }
                        break;
                    case 'Page':
                        text = 'Page: ' + el.label;
                        ret.push({
                            type: 'Text',
                            label: text,
                            title: text,
                            expanded: true,
                            children: this.genPageTreeViewElements(el.children),
                            data: el
                        });
                        break;

                    case 'GameModel':
                        text = 'Game model: ' + el.name;
                        ret.push({
                            //  type:'Text',
                            label: text,
                            //  title: text,
                            expanded: true,
                            children: this.genTreeViewElements(el.games),
                            data: el
                        });
                        break;
                    case 'Game':
                        text = 'Game: ' + el.name + ' (token:' + el.token + ')';
                        ret.push({
                            type: 'html',
                            html: text + EDITBUTTONTPL,
                            title: text,
                            expanded: true,
                            children: this.genTreeViewElements(el.teams),
                            data: el,
                            contentStyle: this.getClassName('icon-game')
                        });
                        break;
                    case 'Team':
                        text = 'Team: ' + el.name;
                        ret.push({
                            type: 'html',
                            html: text + EDITBUTTONTPL,
                            title: text,
                            expanded: false,
                            children: this.genTreeViewElements(el.players),
                            data: el,
                            contentStyle: this.getClassName('icon-team')
                        });
                        break;
                    case 'Player':
                        ret.push({
                            type: 'html',
                            html: 'Player: ' + el.name + EDITBUTTONTPL,
                            title: 'Player: ' + el.name,
                            data: el,
                            contentStyle: this.getClassName('icon-player')
                        });
                        break;
                    default:
                        text = (class2text[el['@class']] || el['@class']) + ': ' + el.name;
                        ret.push({
                            type: 'Text',
                            label: text,
                            title: text,
                            data: el
                        });
                        break;
                    }
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
            excludeClasses: {
                value: null
            },
            dataSource: {}
        }
    });


    Y.namespace('Wegas').WTreeView = WTreeView;
});