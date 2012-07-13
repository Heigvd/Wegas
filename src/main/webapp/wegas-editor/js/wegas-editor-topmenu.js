
/**
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-editor-topmenu', function(Y) {
    var CONTENTBOX = 'contentBox',
    YAHOO = Y.YUI2,

    EditorTopMenu = Y.Base.create("wegas-editor-topmenu", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        renderUI: function () {
//            var cb = this.get(CONTENTBOX),
//            onMenuItemClick = function () {
//                alert("Callback for MenuItem: " + this.cfg.getProperty("text"));
//            },
//            ua = YAHOO.env.ua,
//            oAnim, aItemData, gamesItemData = [], oItem;
//
//            aItemData = [
//            {
//                text: "Game model: ",
//                submenu: {
//                    id: "gd",
//                    itemdata: [
//                    [{
//                        text: "Load Game",
//                        submenu: {
//                            id: "applications"
//                        //itemdata: gamesItemData
//                        }
//                    },{
//                        text: "Game Explorer",
//                        disabled: true
//                    }], [{
//                        text: "Type Descriptors",
//                        disabled: true
//                    }, {
//                        text: "Variables",
//                        disabled: true
//                    }, {
//                        text: "Library",
//                        disabled: true
//                    }, {
//                        text: "Templates",
//                        disabled: true
//                    },{
//                        text: "Settings",
//                        disabled: true
//                    }]
//                    ]
//                }
//
//            },
//            {
//                text: "Game: ",
//                submenu: {
//                    id: "filemenu",
//                    itemdata: [
//                    [{
//                        text: "Load Scenario",
//                        disabled: true
//                    },{
//                        text: "Scenario Explorer",
//                        disabled: true
//                    },],
//                    [{
//                        text: "Media Library",
//                        disabled: true
//                    },{
//                        text: "Settings",
//                        disabled: true
//                    }]
//                    ]
//                }
//
//            }/*,
//            {
//                text: "Community",
//                submenu: {
//                    id: "editmenu",
//                    itemdata: [
//                    [{
//                        text: "Users",
//                        disabled: true
//                    }, {
//                        text: "Group",
//                        disabled: true
//                    }]
//                    ]
//                }
//            }*/
//            ];
//
//            var oMenuBar = new YAHOO.widget.MenuBar("topmenubar", {
//                lazyload: true,
//                itemdata: aItemData,
//                //autosubmenudisplay: true,
//                hidedelay: 150,
//                effect: {
//                    effect: YAHOO.widget.ContainerEffect.FADE,
//                    duration: 0.1
//                }
//            });
//
//
//            function onSubmenuBeforeShow(p_sType, p_sArgs) {
//
//                var oBody,
//                oElement,
//                oShadow,
//                oUL;
//                if (this.parent) {
//                    oElement = this.element;
//                    oShadow = oElement.lastChild;
//                    oShadow.style.height = "0px";
//
//                    if (oAnim && oAnim.isAnimated()) {
//                        oAnim.stop();
//                        oAnim = null;
//                    }
//
//                    oBody = this.body;
//                    if (this.parent &&
//                        !(this.parent instanceof YAHOO.widget.MenuBarItem)) {
//                        if (ua.gecko || ua.opera) {
//                            oBody.style.width = oBody.clientWidth + "px";
//                        }
//                        if (ua.ie == 7) {
//                            oElement.style.width = oElement.clientWidth + "px";
//                        }
//                    }
//
//                    oBody.style.overflow = "hidden";
//                    oUL = oBody.getElementsByTagName("ul")[0];
//                    oUL.style.marginTop = ("-" + oUL.offsetHeight + "px");
//                }
//            }
//
//            function onTween(p_sType, p_aArgs, p_oShadow) {
//                if (this.cfg.getProperty("iframe")) {
//                    this.syncIframe();
//                }
//                if (p_oShadow) {
//                    p_oShadow.style.height = this.element.offsetHeight + "px";
//                }
//            }
//
//            function onAnimationComplete(p_sType, p_aArgs, p_oShadow) {
//                var oBody = this.body,
//                oUL = oBody.getElementsByTagName("ul")[0];
//
//                if (p_oShadow) {
//                    p_oShadow.style.height = this.element.offsetHeight + "px";
//                }
//                oUL.style.marginTop = "";
//                oBody.style.overflow = "";
//                if (this.parent &&
//                    !(this.parent instanceof YAHOO.widget.MenuBarItem)) {
//                    if (ua.gecko || ua.opera) {
//                        oBody.style.width = "";
//                    }
//                    if (ua.ie == 7) {
//                        this.element.style.width = "";
//                    }
//                }
//            }
//
//            function onSubmenuShow(p_sType, p_sArgs) {
//                var oElement,
//                oShadow,
//                oUL;
//
//                if (this.parent) {
//
//                    oElement = this.element;
//                    oShadow = oElement.lastChild;
//                    oUL = this.body.getElementsByTagName("ul")[0];
//
//                    oAnim = new YAHOO.util.Anim(oUL,
//                    {
//                        marginTop: {
//                            to: 0
//                        }
//                    },
//                    .5, YAHOO.util.Easing.easeOut);
//
//                    oAnim.onStart.subscribe(function () {
//                        oShadow.style.height = "100%";
//                    });
//                    oAnim.animate();
//                    if (YAHOO.env.ua.ie) {
//                        oShadow.style.height = oElement.offsetHeight + "px";
//                        oAnim.onTween.subscribe(onTween, oShadow, this);
//                    }
//                    oAnim.onComplete.subscribe(onAnimationComplete, oShadow, this);
//                }
//            }
//
//            // oMenuBar.subscribe("beforeShow", onSubmenuBeforeShow);
//            //  oMenuBar.subscribe("show", onSubmenuShow);
//
//            oMenuBar.render(cb);
//
//            menuNode = new Y.Node(oMenuBar.body);
//            menuNode.addClass("yuimenubarnav");

        }
    }, {
        ATTRS : { }
    });

    Y.namespace('Wegas').EditorTopMenu = EditorTopMenu;
});