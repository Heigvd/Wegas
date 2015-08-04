/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Wegas Dashboard - V2
 * @author Raphaël Schmutz <raph@hat-owl.cc>
 */
YUI.add('wegas-dashboard', function(Y) {
    "use strict";
    /*Y.Wegas.DashboardCard = Y.Base.create("wegas-dashboard-card", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], { 
        CONTENT_TEMPLATE:   "<div class='wegas-dashboard-card card card--player'>"+
                                "<div class='card__icon'></div>"+
                                "<div class='card__title'></div>"+
                                "<div class='card__blocs card__blocs--actions'>"+
                                    "<span class='title'>Actions</span>"+
                                    "<a href='#' class='bloc bloc--icon bloc--action-impacts' title='Run impacts'>Run impacts</a>"+
                                    "<a href='#' class='bloc bloc--icon bloc--action-email' title='Send real eMail'>Send real eMail</a>"+
                                "</div>"+
                                "<div class='card__blocs card__blocs--infos'>"+
                                    "<span class='title'>Infos</span>"+
                                    "<a href='#' class='bloc bloc--icon bloc--info-notes' title='Notes'>Notes</a>"+
                                    "<a href='#' class='bloc bloc--icon bloc--info-view' title='View'>View</a>"+
                                "</div>"+
                            "</div>",
        renderUI: function() {
            this.get("container").append(this.get("contentBox"));
        },
        bindUI: function() {
            this.get("contentBox").delegate("click", function(event) {
                event.stopPropagation();
                event.preventDefault();
                new Y.Wegas.Modal({
                    "title":"Infos - Player \"" + this.get("team").get("players")[0].get("name") + "\"", 
                    "illustration":"user",
                    "children": [{
                        "type": "DashboardInfos",
                        "team": this.get("team")
                    }],
                    "actions": [{
                        "types": ["primary"],
                        "label": "Save", 
                        "do": function(){
                            if (this.get("team").get("notes") !== this.item(0).getNote()) {
                                this.get("team").set("notes", this.item(0).getNote());
                                Y.Wegas.Facade.Game.cache.put(this.get("team").toObject("players"), {});
                            }
                        }
                    },{
                        "label": "Cancel", 
                        "do": function(){
                            this.close();
                        }
                    }]
                }).render();
            }, ".bloc--info-notes", this);
            
            this.get("contentBox").delegate("click", function(event) {
                event.stopPropagation();
                event.preventDefault();
                (this.get("team") && this.get("team").get("players").length) 
                    ? window.open("game-lock.html?id=" + this.get("team").get("players")[0].get("id"))
                    : this.showMessage("info", "Could not find a player");
            }, ".bloc--info-view", this);
            
            this.get("contentBox").delegate("click", function(event) {
                event.stopPropagation();
                event.preventDefault();
            }, ".bloc--action-impacts", this);
            
            this.get("contentBox").delegate("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, ".bloc--action-email", this);
        },
        syncUI: function() { 
            this.get("contentBox")
                .one(".card__title")
                .append(this.get("team").get("players")[0].get("name"));
        },
        initializer: function(config) {
            this.set("container", (config.container || Y.one("body")));
            this.set("team", config.team);            
            if(!config.individually){
                this.plug(Y.Wegas.DashboardCardGroupByTeam);
            }
            if(config.monitoredData !== null && config.columns !== null){
                this.set("monitoring", {
                    columns : config.columns,
                    data : config.monitoredData
                });
                this.plug(Y.Wegas.DashboardCardMonitoring);
            }
            this.renderer();
        }
    });*/
    
    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE:"<div class='wegas-dashboard'></div>",
        syncUI:function(){
            var context = this;
            this.get("cardsData").forEach(function(data){
                context.add(new Y.Wegas.Card({
                    "title": data.title,
                    "icon": data.icon || null,
                    "blocs": data.blocs || [],
                    "actions": data.actions || []
                }));
            });
            
        }
    },{
        ATTRS:{
            cardsData:{
                value:[]
            }
        }
    }); 
    
    
    /**
     * @name Y.Wegas.Dashboard
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @augments Y.Wegas.Editable
     *//*
    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE:"<div class='wegas-dashboard'></div>",
        _resizeCards: function(windowWidth, columns){
                if(columns === null || columns === undefined){
                    columns = [];
                }
                var limit = {
                    large: 560 + (columns.length * 80),
                    medium: 560 + (columns.length * 65),
                    small: (columns.length * 65) + 64
                };
                if(windowWidth < limit.large){
                    if(windowWidth >= limit.medium){
                        if(!Y.one(".wegas-dashboard").hasClass("dashboard--large")){
                            Y.one(".wegas-dashboard")
                                    .removeClass("dashboard--big")
                                    .removeClass("dashboard--medium")
                                    .removeClass("dashboard--small")                                    
                                    .addClass("dashboard--large");
                            Y.all(".card__title").removeAttribute('style') 
                                .setStyle("width", "calc(100% - "+ ((columns.length * 65) + 346) +"px)");
                            Y.all(".card__blocs--monitoring").removeAttribute('style')
                                .setStyle('width', ((columns.length * 65) + 2) + "px");
                        }
                    }else{
                        if(windowWidth >= limit.small){
                            if(!Y.one(".wegas-dashboard").hasClass("dashboard--medium")){
                                Y.one(".wegas-dashboard")
                                    .removeClass("dashboard--big")
                                    .removeClass("dashboard--large")
                                    .removeClass("dashboard--small")
                                    .addClass("dashboard--medium");
                                Y.all(".card__title").removeAttribute('style');
                                Y.all(".card__blocs--monitoring").removeAttribute("style");
                            }
                        }else{
                            if(!Y.one(".wegas-dashboard").hasClass("dashboard--small")){
                                Y.one(".wegas-dashboard")
                                    .removeClass("dashboard--big")
                                    .removeClass("dashboard--large")
                                    .removeClass("dashboard--medium")
                                    .addClass("dashboard--small");
                                Y.all(".card__title").removeAttribute('style');
                                Y.all(".card__blocs--monitoring").removeAttribute("style");
                            }
                        }
                    }
                }else{
                    if(!Y.one(".wegas-dashboard").hasClass("dashboard--big")){
                        Y.one(".wegas-dashboard")
                            .removeClass("dashboard--large")
                            .removeClass("dashboard--medium")
                            .removeClass("dashboard--small")
                            .addClass("dashboard--big");
                      
                        Y.all(".card__title").removeAttribute('style').setStyle("width", "calc(100% - "+ ((columns.length * 80) + 346) +"px)");
                        Y.all(".card__blocs--monitoring").removeAttribute('style').setStyle('width', ((columns.length * 80) + 2) + "px");    
                    }
                }
        },
        _cleanClass: function(){
            Y.one(".wegas-dashboard")
                .removeClass("dashboard--big")
                .removeClass("dashboard--large")
                .removeClass("dashboard--medium")
                .removeClass("dashboard--small");
        },
        renderUI: function() {
            if(this.toolbar) {
                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span>Refresh',
                    on: {
                        click: Y.bind(function() {
                            this.syncUI();
                        }, this)
                    }
                }));
            }
        },
        bindUI: function() {
        },
        syncUI: function() {
            var gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(), 
                teams = Y.Wegas.Facade.Game.cache.getCurrentGame().get("teams"),
                resize = this._resizeCards,
                cleanClass = this._cleanClass,
                contentBox = this.get("contentBox");
            this._getCustomData(this.get("remoteScript")).then(function(res) {
                cleanClass();
                contentBox.empty();
                teams.forEach(function(team){
                    if(team.get("@class") !== "DebugTeam" && team.get("players").length > 0){
                        new Y.Wegas.DashboardCard({
                            "team": team, 
                            "individually": gameModel.get("properties.freeForAll"),
                            "container": contentBox,
                            "monitoredData": (res instanceof Object && Object.keys(res).length === 0) ? null : res.data[team.get("id")],
                            "columns": (res instanceof Object && Object.keys(res).length === 0) ? null : res.columns
                        });
                    }
                });
                Y.one(window).purge().on("resize", function(e){
                    var windowWidth = e.target.get('winWidth');
                    resize(windowWidth, res.columns);
                }, this);
                resize(window.innerWidth, res.columns);
            });
        },
        _getCustomData: function(script){
            // var script = this.get("remoteScript");
            if (script) {
                return new Y.Promise(function(resolve, reject) {
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/Script/Run/" + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id"),
                        cfg: {
                            method: "POST",
                            headers: {"Managed-Mode": false},
                            data: {
                                "@class": "Script",
                                content: script
                            }
                        },
                        on: {
                            success: function(e) {
                                resolve(e.response.results);
                            },
                            failure: reject
                        }
                    });
                });
            } else {
                return Y.Promise.resolve([]);
            }
        }
    }, {
        ATTRS: {
            remoteScript: {
                value: "",
                getter: function() {
                    var dashboard = Y.namespace("Wegas.Config.Dashboard");
                    return Y.Lang.isFunction(dashboard) ?
                        dashboard().remoteScript :
                        dashboard.remoteScript;
                }
            }
        }
    });*/
});
