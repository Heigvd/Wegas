/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 *
 */



YUI.add('wegas-editor-treeview', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', WTreeView,
    EDITBUTTONTPL = "<span class=\"wegas-treeview-editmenubutton\"></span>";

    WTreeView = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private fields ** //
        dataSource: null,
        treeView: null,

        // ** Lifecycle methods ** //
        initializer: function () {
            this.dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
        },

        renderUI: function () {
            this.treeView = new Y.TreeView();
            this.treeView.render(this.get(CONTENTBOX));
        },

        bindUI: function () {

            this.dataSource.after("response", this.syncUI, this);               // Listen updates on the target datasource

            this.dataSource.after("response", this.syncUI, this);               // Listen updates on the target datasource

            function onClick (e) {

                Y.log(e.target.get("label") + " label was clicked", "info", "Wegas.WTreeView");

                var entity = e.target.get("data");
                e.halt(true);
                // Either show the edit menu
                //                if (e.event.target.className === "wegas-treeview-editmenubutton") {  // Either show the edit menu
                //                    Y.Wegas.editor.showEditMenu(e.node.data, this.dataSource);
                //                    Y.Wegas.editor._editMenu.get("boundingBox").appendTo(e.event.target.parentNode);
                //                    Y.Wegas.editor._editMenu.set("align", {
                //                        node: e.event.target,
                //                        points: ["tr", "br"]
                //                    });
                //                } else {                                                        // Or display the edit tab
                Y.Wegas.editor.showUpdateForm(entity, this.dataSource);

                if (entity instanceof Y.Wegas.persistence.FSMDescriptor) {
                    Y.Wegas.TabView.findTabAndLoadWidget( "State machine editor",
                    "#centerTabView", null, {
                        type: "StateMachineViewer",
                        //entity: entity                                          // @fixme this should work and we should not need a callback
                    }, Y.bind(function (entity, statemachineviewer) {
//                        statemachineviewer.set("entity", entity);
                    }, this, entity));
                }
            }

            this.treeView.on("treeleaf:click", onClick, this);
            this.treeView.on("treenode:click", onClick, this);
        },

        syncUI: function () {
            var treeViewElements = this.genTreeViewElements(this.dataSource.rest.getCache());
            this.treeView.removeAll();
            this.treeView.add(treeViewElements);
            return;
            this.treeView.add({
                children: [{
                        type: "TreeNode",
                        collapsed: false,
                        label: "/",
                        rightWidget: new Y.Wegas.WegasMenu({
                            items: [{
                                    label:"refresh",
                                    imgSrc:""
                                },{
                                    label:"add dir",
                                    imgSrc:""
                                },{
                                    label:"add file",
                                    imgSrc:""
                                } ],
                            horizontal: true,
                            params:{
                                path: ""
                            }
                        })
                    }],
                type: "TreeNode",
                collapsed: false,
                label: "/"
            });

        },

        destroyer: function () {
            this.treeView.destroy();
        },



        // ** Private methods ** //

        onNodeClick: function (e) {

        },

        genTreeViewElements: function (elements) {
            var ret = [], i, el, text;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];

                    if (el.get &&
                        (this.get("excludeClasses") === null
                        || !this.get('excludeClasses').hasOwnProperty(el['@class']))
                        && (this.get('includeClasses') === null
                        || this.get('includeClasses').hasOwnProperty(el['@class']))) {

                        switch (el.get('@class')) {
                            case 'StringDescriptor':
                            case 'NumberDescriptor':
                            case 'InboxDescriptor':
                            case 'ChoiceDescriptor':
                            case 'TriggerDescriptor':
                            case 'TaskDescriptor':
                            case 'ResourceDescriptor':
                            case 'DialogueDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.get("name");
                                ret.push({
                                    type: 'TreeNode',
                                    label: text + EDITBUTTONTPL,
                                    children: this.genScopeTreeViewElements(el),
                                    data: el,
                                    iconCSS: "wegas-icon-variabledescriptor",
                                    //iconCSS: "wegas-icon-" + el.get('@class')
                                });
                                break;

                            case 'ListDescriptor':
                            case 'QuestionDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.get("name");
                                ret.push({
                                    type: 'TreeNode',
                                    label: text + EDITBUTTONTPL,
                                    children: this.genTreeViewElements(el.get("items")),
                                    data: el
                                });
                                break;

                            case 'Page':
                                text = 'Page: ' + el.label;
                                //                                ret.push({
                                //                                    type: 'Text',
                                //                                    label: text,
                                //                                    title: text,
                                //                                    expanded: true,
                                //                                    children: this.genPageTreeViewElements(el.children),
                                //                                    data: el
                                //                                });
                                break;

                            //                            case 'GameModel':
                        //                                text = 'Game model: ' + el.get("name");
                    //                                ret.push({
                //                                    //  type:'Text',
            //                                    label: text,
        //                                    //  title: text,
    //                                    expanded: true,
//                                    children: this.genTreeViewElements(el.get("games")),
//                                    data: el
//                                });
//                                break;
//                            case 'Game':
//                                text = 'Game: ' + el.get("name") + ' (token:' + el.get("token") + ')';
//                                ret.push({
//                                    type: 'html',
//                                    html: text + EDITBUTTONTPL,
//                                    title: text,
//                                    expanded: true,
//                                    children: this.genTreeViewElements(el.get("teams")),
//                                    data: el,
//                                    contentStyle: this.getClassName('icon-game')
//                                });
//                                break;
//                            case 'Team':
//                                text = 'Team: ' + el.get("name");
//                                ret.push({
//                                    type: 'html',
//                                    html: text + EDITBUTTONTPL,
//                                    title: text,
//                                    expanded: false,
//                                    children: this.genTreeViewElements(el.get("players")),
//                                    data: el,
//                                    contentStyle: this.getClassName('icon-team')
//                                });
//                                break;
//                            case 'Player':
//                                ret.push({
//                                    type: 'html',
//                                    html: 'Player: ' + el.get("name") + EDITBUTTONTPL,
//                                    title: 'Player: ' + el.get("name"),
//                                    data: el,
//                                    contentStyle: this.getClassName('icon-player')
//                                });
//                                break;
default:
text = el.get('@class') + ': ' + el.get("name");
//                                ret.push({
//                                    title: text,
//                                    data: el
//                                });
break;
}
}
}
}
return ret;
},

genScopeTreeViewElements: function (el) {
var children = [], i, label, team, player, instance;

for (i in el.get("scope").get("variableInstances")) {
if (el.get("scope").get("variableInstances").hasOwnProperty(i)) {
instance = el.get("scope").get("variableInstances")[i];
label = '';
switch (el.get("scope").get('@class')) {
case 'PlayerScope':
player = Y.Wegas.GameFacade.rest.getPlayerById(i);
label = (player) ? player.get("name") : "undefined";
break;
case 'TeamScope':
team = Y.Wegas.GameFacade.rest.getTeamById(i);
label = (team) ? team.get("name") : "undefined";
break;
case 'GameScope':
case 'GameModelScope':
label = 'Global';
break;
}
children.push(this.genVariableInstanceElements(label, instance));
}
}
return children;
},

genVariableInstanceElements: function (label, el) {
var l;
switch (el.get('@class')) {
case 'StringInstance':
case 'NumberInstance':
case 'ListInstance':
return {
label: label + ': ' + el.get("value"),
data: el
};

case 'QuestionInstance':
l = label + ((el.get("replies").length > 0) ? ': ' + el.get("replies").get("name") : ': unanswered');
return {
label: l,
data: el
};

case 'InboxInstance':
var k, children = [];

label += "(" + el.get("messages").length + ")";

for (k = 0; k < el.get("messages").length; k += 1) {
children.push({
label: el.get("messages")[k].get("subject")
//data: el.get("messages")[k]
});
}
return {
type: 'TreeNode',
label: label,
data: el,
children: children
};

default:
return {
label: label,
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
}
}, {
ATTRS : {
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