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
    Y.Wegas.DashboardCard = Y.Base.create("wegas-dashboard-card", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], { 
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
                var team = Y.Wegas.Facade.Game.cache.getTeamById(this.get("team").get("id")),
                    game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    statusNode = Y.Node.create("<span></span>"),
                    header = "<span class='wegas-modal-title wegas-modal-title-player'>Infos - Player \"" + team.get("players")[0].get("name") + "\"</span>",
                    modalInfos = new Y.Wegas.Panel({
                        modal: true,
                        team: team,
                        children: [{
                            type: "DashboardInfos",
                            team: team
                        }],
                        headerContent: header,
                        footerContent: statusNode,
                        width: 600,
                        zIndex: 5000,
                        buttons: {
                            header: [
                                {
                                    name: 'cancel',
                                    classNames: "modal--header-close",
                                    label: 'Cancel',
                                    action: "exit"
                                }
                            ],
                            footer: [
                                {
                                    name: "save",
                                    label: "Save",
                                    classNames: "modal--footer-right modal--footer-valid",
                                    action: function() {
                                        if (team.get("notes") !== this.item(0).getNote()) {
                                            team.set("notes", this.item(0).getNote());
                                            Y.Wegas.Facade.Game.cache.put(team.toObject("players"), {});
                                        }
                                    }
                                },{
                                    name: 'cancel',
                                    label: 'Cancel',
                                    classNames: "modal--footer-right",
                                    action: "exit"
                                }
                            ]
                        }
                    }); 
                    modalInfos.render().get("boundingBox").addClass("dashboard-infos-panel").addClass("dashboard-panel");
                if(!game.get("properties.freeForAll")){
                    modalInfos.plug(Y.Wegas.DashboardInfosTeam);
                }

            }, ".bloc--info-notes", this);
            
            this.get("contentBox").delegate("click", function(event) {
                event.stopPropagation();
                event.preventDefault();
                var team = this.get("team");
                if (team && team.get("players").length) {
                    window.open("game-lock.html?id=" + team.get("players")[0].get("id"));
                } else {
                    this.showMessage("info", "Could not find a player");
                }
            }, ".bloc--info-view", this);
            
            this.get("contentBox").delegate("click", function(event) {
                event.stopPropagation();
                event.preventDefault();
                var team = Y.Wegas.Facade.Game.cache.getTeamById(this.get("team").get("id")), header, statusNode = Y.Node.create("<span></span>");
                if (team && team.get("players").length) {
                    if(!Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll")){
                        header = "<span class='wegas-modal-title wegas-modal-title-group'>Impact team \"" + team.get("name") + "\"</span>";
                    }else{
                        header = "<span class='wegas-modal-title wegas-modal-title-player'>Impact player \"" + team.get("players")[0].get("name") + "\"</span>";
                    }
                    new Y.Wegas.Panel({
                        modal: true,
                        children: [{
                            type: "CustomConsole",
                            player: team.get("players")[0],
                            statusNode: statusNode
                        }],
                        headerContent: header,
                        footerContent: statusNode,
                        width: 600,
                        /*height: 600,*/
                        zIndex: 5000,
                        buttons: {                
                            header: [
                                {
                                    name: 'proceed',
                                    classNames: "modal--header-close",
                                    label: 'Close',
                                    action: "exit"
                                }
                            ],
                            footer: [
                                {
                                    name: "src",
                                    label: "View src",
                                    classNames: "modal--footer-left wegas-advanced-feature modal--footer-secondary",
                                    action: function() {
                                        this.item(0).viewSrc();
                                    }
                                },
                                {
                                    name: "run",
                                    label: "Apply impact",
                                    classNames: "modal--footer-right modal--footer-valid",
                                    action: function() {
                                            this.item(0).run(this);
                                    }
                                },{
                                    name: 'proceed',
                                    label: 'Cancel',
                                    classNames: "modal--footer-right",
                                    action: "exit"
                                }
                            ]
                        }
                    }).render().get("boundingBox").addClass("dashboard-impact-panel").addClass("dashboard-panel");
                } else {
                    this.showMessage("info", "Could not find a player");
                }
            }, ".bloc--action-impacts", this);
            
            this.get("contentBox").delegate("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
                var team = Y.Wegas.Facade.Game.cache.getTeamById(this.get("team").get("id")),
                    i, header, statusNode = Y.Node.create("<span></span>");
                if (team && team.get("players").length) {
                    if(!Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll")){
                        header = "<span class='wegas-modal-title wegas-modal-title-group'>Send real E-Mail to players of team \"" + team.get("name") + "\"</span>";
                    }else{
                        header = "<span class='wegas-modal-title wegas-modal-title-player'>Send real E-Mail to player \"" + team.get("players")[0].get("name") + "\"</span>";
                    }
                    var modalEmail = new Y.Wegas.Panel({
                        cssClass: "wegas-form-panel",
                        modal: true,
                        children: [{
                            type: "SendMail",
                            players: team.get("players"),
                            statusNode: statusNode
                        }],
                        headerContent: header,
                        footerContent: statusNode,
                        width: 600,
                        zIndex: 5000,
                        buttons: {
                            header: [
                                {
                                    name: 'cancel',
                                    classNames: "modal--header-close",
                                    label: 'Cancel',
                                    action: "exit"
                                }
                            ],
                            footer: [
                                {
                                    name: "send",
                                    label: "Send",
                                    classNames: "modal--footer-right modal--footer-valid",
                                    action: function() {
                                        this.item(0).send();
                                    }
                                },{
                                    name: 'cancel',
                                    label: 'Cancel',
                                    classNames: "modal--footer-right",
                                    action: "exit"
                                }
                            ]
                        },
                        on: {
                            "email:sent": function() {
                                this.exit();
                            }
                        }
                    }).render().get("boundingBox");
                    modalEmail.addClass("dashboard-mail-panel").addClass("dashboard-panel");
                    modalEmail.delegate("keyup", function(e){
                        if(this.get("value").length > 0){
                            if(!this.hasClass("selected")){
                                this.addClass("selected"); 
                            }
                        }else{
                            if(this.hasClass("selected")){
                                this.removeClass("selected"); 
                            }
                        }
                    }, "input[type='text']");
                } else {
                    this.showMessage("info", "Could not find a player");
                }

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
            this.renderUI();
            this.bindUI();
            this.syncUI();
        }
    });
    Y.Wegas.DashboardCardMonitoring = Y.Base.create("wegas-dashboard-card-monitoring", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        _renderBlocInfo: function(container, column, value){
            var bloc = Y.Node.create("<div class='bloc bloc--monitoring'>"+
                                            "<span class='label'>" + column.label + "</span>"+
                                            "<span class='value'>" + value + "</span>"+
                                        "</div>");
            if(column.formatter != "null" && column.formatter != "undefined"){
                eval("("+column.formatter+")")(bloc, value);
            }
            container.append(bloc);
        },
        _renderCustomInfos : function(){
            var host = this.get("host"),
                rend = this._renderBlocInfo,
                node = Y.Node.create(   "<div class='card__blocs card__blocs--monitoring'>"+                                    
                                            "<span class='title'>Monitoring</span>"+
                                        "</div>");
                                
            this.get("host")
                .get("contentBox")
                .append(node);
            
            host.get("monitoring").columns.forEach(function(column){ 
                rend(node, column, host.get("monitoring").data[column.label]);
            });
        },
        initializer: function() {
            this.afterHostMethod("syncUI", function() {
                if(this.get("host").get("monitoring").columns.length > 0){
                    this._renderCustomInfos();
                }
            });
        }
    });
    Y.Wegas.DashboardCardMonitoring.NS = "DashboardCardMonitoring";
    
    Y.Wegas.DashboardCardGroupByTeam = Y.Base.create("wegas-dashboard-card-group-by-team", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        initializer: function() {
            var host = this.get("host");
            this.afterHostMethod("syncUI", function() {
                host.get("contentBox").one(".card__title").empty().append(host.get("team").get("name"));
                host.get("contentBox").removeClass("card--player").addClass("card--team");
            });
        }
    });
    Y.Wegas.DashboardCardGroupByTeam.NS = "DashboardCardGroupByTeam";
    
    Y.Wegas.DashboardInfosTeam = Y.Base.create("wegas-dashboard-infos-team", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        initializer: function() {
            var host = this.get("host");
            this.afterHostEvent("render", function() {
                host.get("contentBox")
                    .one(".wegas-modal-title")
                    .removeClass("wegas-modal-title-player")
                    .addClass("wegas-modal-title-group");
            //      .set("content", 'Infos - Team "'+ host.get("team").get("name") +'"');
            });
        }
    });
    Y.Wegas.DashboardInfosTeam.NS = "DashboardInfosTeam";
    
    Y.Wegas.DashboardInfos = Y.Base.create("wegas-dashboard-infos", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE:"<div class='wegas-dashboard-infos'><textarea class='infos-comments' placeholder='Enter a comment here'></textarea></div>",
        renderUI: function() {},
        bindUI: function() {},
        syncUI: function() {
            var infos = this;
            tinyMCE.init({
                "width": "100%",
                "height": "100%",
                "menubar":false,
                "statusbar": false,
                "toolbar": "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist",
                "selector":'.infos-comments',
                setup: function (mce) {
                    mce.on('init', function(args) {
                        infos.set("editor", args.target);
                        if(infos.get("team").get("notes")){
                            infos.get("editor").setContent(infos.get("team").get("notes"));
                        }else{
                            infos.get("editor").setContent("You can write notes here");
                        }
                    });
                }
            });
        },
        initializer: function(config) {
            this.set("team", config.team);
        },
        getNote: function(){
            return this.get("editor").getContent();
        }
    });
    
    /**
     * @name Y.Wegas.Dashboard
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @augments Y.Wegas.Editable
     */
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
            /**
             * server script to get table data.
             * format: [{id:TEAMID[, TABLE_KEY:VALUE]*}*]
             * or a function which should return this array
             */
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
    });
});
