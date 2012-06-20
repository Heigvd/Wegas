/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */



YUI.add('wegas-treeview', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', WTreeView,
    YAHOO = Y.YUI2,
    EDITBUTTONTPL = "<span class=\"yui3-wegas-treeview-editmenubutton\"></span>";

    WTreeView = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private fields ** //
        dataSource: null,
        pushButton: null,
        treeView: null,

        // ** Lifecycle methods ** //
        initializer: function () {
            this.dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
        },

        renderUI: function () {
            var node = this.get(CONTENTBOX).append('<div></div>');

            // Render YUI2 TreeView widget
            this.treeView = new YAHOO.widget.TreeView(node.getDOMNode());
            this.treeView.singleNodeHighlight = true;
            this.treeView.render();

            this.renderToolbar();
        },

        bindUI: function () {
            // Listen updates on the target datasource
            this.dataSource.after("response", function (e) {
                var treeViewElements = this.genTreeViewElements(e.data);
                this.treeView.removeChildren(this.treeView.getRoot());
                this.treeView.buildTreeFromObject(treeViewElements);
                this.treeView.render();
            }, this);

            // When a leaf is clicked
            this.treeView.subscribe("clickEvent", function (e) {
                YAHOO.log(e.node.index + " label was clicked", "info", "Wegas.WTreeView");
                // Either show the edit menu
                if (e.event.target.className === "yui3-wegas-treeview-editmenubutton") {
                    Y.Wegas.editor.showEditMenu(e.node.data, this.dataSource);
                    Y.Wegas.editor._editMenu.get("boundingBox").appendTo(e.event.target.parentNode);
                    Y.Wegas.editor._editMenu.set("align", {
                        node: e.event.target,
                        points: ["tr", "br"]
                    });
                } else {                                                        // Or display the edit tab
                    Y.Wegas.editor.showEditPanel(e.node.data, this.dataSource);
                }
            }, null, this);

            // Turn tree element selection on
            this.treeView.subscribe('clickEvent', this.treeView.onEventToggleHighlight);

            // Hide the menu as soon as user mouses out
            this.get(CONTENTBOX).delegate('mouseleave', Y.Wegas.editor._editMenu.hide, '.ygtvrow');
        },

        syncUI: function () {
        },

        destroyer: function () {
            this.treeView.destroy();
        },

        // ** Private methods ** //

        renderToolbar: function () {
            var el = this.get("parent").get('panelNode').one(".wegas-tab-toolbar");

//            this.newButton = new Y.Button({
//                label: "<span class=\"wegas-icon wegas-icon-new\"></span>",
//                on: {
//                    click: Y.bind(function () {
//                        Y.Wegas.editor.showAddPanel({
//                            "@class": e.button.data['@class']
//                        }, null, this.dataSource);
//                    }, this)
//                }
//            }).render(el);
//"toolbarButtons": [{
//                    "type": "push",
//                    "label": "New variable",
//                    "value": "new",
//                    "id": "new",
//                    "data": {
//                        "dataSource":"VariableDescriptor",
//                        "@class": "VariableDescriptor"
//                    }
//                },{
//                    "type": "push",
//                    "label": "Reset this game",
//                    "value": "reset",
//                    "id": "reset"
//                }]
        },
        genVariableInstanceElements: function (label, el) {
            var l;

            switch (el['@class']) {
                case 'StringInstance':
                case 'NumberInstance':
                case 'ListInstance':
                    return {
                        label: label + ': ' + el.value,
                        title: label + ': ' + el.value,
                        data: el
                    };

                case 'QuestionInstance':
                    l = label + ((el.replies.length > 0) ? ': ' + el.replies[0].name : ': unanswered');
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
                QuestionDescriptor: "Question",
                StringDescriptor: "String",
                NumberDescriptor: "Number",
                ListDescriptor: "List",
                ChoiceDescriptor: "Choice",
                InboxDescriptor: "Inbox",
                TriggerDescriptor: "Trigger"
            }, ret = [], i, el, text;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];

                    if ((this.get("excludeClasses") === null
                        || !this.get('excludeClasses').hasOwnProperty(el['@class']))
                    && (this.get('includeClasses') === null
                        || this.get('includeClasses').hasOwnProperty(el['@class']))) {
                        switch (el['@class']) {
                            case 'StringDescriptor':
                            case 'NumberDescriptor':
                            case 'InboxDescriptor':
                            case 'ChoiceDescriptor':
                            case 'TriggerDescriptor':
                            case 'TaskDescriptor':
                            case 'ResourceDescriptor':
                                text = (class2text[el['@class']] || el['@class']) + ': ' + el.name;
                                ret.push({
                                    type: 'html',
                                    html: text + EDITBUTTONTPL,
                                    title: text,
                                    children: this.genScopeTreeViewElements(el),
                                    data: el,
                                    contentStyle: this.getClassName('icon-' +el['@class'])
                                });

                                break;

                            case 'ListDescriptor':
                            case 'QuestionDescriptor':
                                text = (class2text[el['@class']] || el['@class']) + ': ' + el.name;
                                ret.push({
                                    type: 'html',
                                    html: text + EDITBUTTONTPL,
                                    title: text,
                                    //children: this.genScopeTreeViewElements(el),
                                    children: this.genTreeViewElements(el.items),
                                    data: el,
                                    contentStyle: this.getClassName('icon-'+el['@class'])
                                });
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