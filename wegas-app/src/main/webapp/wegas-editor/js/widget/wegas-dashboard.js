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
                var team = this.get("team");
                if (team && team.get("players").length) {
                    window.open("game-lock.html?id=" + team.get("players")[0].get("id"));
                } else {
                    this.showMessage("info", "Could not find a player");
                }
            }, ".action--view", this);
            
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
            }, ".action--impacts", this);
            
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

            }, ".action--email", this);
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
            if(config.custom !== null && config.custom !== undefined){
                this.set("monitoring", config.custom);
                this.plug(Y.Wegas.DashboardCardMonitoring);
            }
            this.renderUI();
            this.bindUI();
            this.syncUI();
        }
    });
    Y.Wegas.DashboardCardMonitoring = Y.Base.create("wegas-dashboard-card-monitoring", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        _renderBlocInfo: function(container, index, data){
            var label = data.label || index,
                valueClass = data.colorize && typeof data.value === "number" ? (data.label < 75 ? "danger" : (data.label > 125 ? "success" : "warning")) : "";
            container.append(   "<div class='bloc bloc--monitoring bloc--monitoring-"+ index +"'>"+
                                    "<span class='label'>" + label + "</span>"+
                                    "<span class='value "+ valueClass +"'>" + data.value + "</span>"+
                                "</div>");
        },
        _renderCustomInfos : function(){
            var host = this.get("host"),
                node = Y.Node.create(   "<div class='card__blocs card__blocs--monitoring'>"+                                    
                                            "<span class='title'>Monitoring</span>"+
                                        "</div>");
                node.setStyle('width', ((Object.keys(host.get("monitoring").data).length * 80) + 2) + "px");
                                                        
            this.get("host")
                .get("contentBox")
                .append(node);


            this.get("host")
                .get("contentBox").one(".card__title") 
                .setStyle("width", "calc(100% - "+ ((Object.keys(host.get("monitoring").data).length * 80) + 346) +"px)");


            
            for(var index in host.get("monitoring").data) { 
                this._renderBlocInfo(node, index, host.get("monitoring").data[index]);
            }
        },
        initializer: function() {
            this.afterHostMethod("syncUI", function() {
                if(Object.keys(this.get("host").get("monitoring").data).length > 0){
                    this._renderCustomInfos();
                }
            });
        }
    });
    Y.Wegas.DashboardCardMonitoring.NS = "DashboardCardMonitoring";
    
    Y.Wegas.DashboardCardGroupByTeam = Y.Base.create("wegas-dashboard-card-broup-by-team", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        initializer: function() {
            var host = this.get("host");
            this.afterHostMethod("syncUI", function() {
                host.get("contentBox").one(".card__title").empty().append(host.get("team").get("name"));
                host.get("contentBox").removeClass("card--player").addClass("card--team");
            });
        }
    });
    Y.Wegas.DashboardCardGroupByTeam.NS = "DashboardCardGroupByTeam";
    
    /**
     * @name Y.Wegas.Dashboard
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @augments Y.Wegas.Editable
     */
    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE:"<div class='wegas-dashboard'></div>",
        _resizeCards: function(windowWidth, custom){
                var limit = {
                    large: 560 + (Object.keys(custom.data).length * 80),
                    medium: 560 + (Object.keys(custom.data).length * 65),
                    small: (Object.keys(custom.data).length * 65) + 64,
                    extrasmall: 80 + 150 + 234 + 64
                };
                if(windowWidth < limit.large){
                    if(windowWidth >= limit.medium){
                        if(!Y.one(".wegas-dashboard").hasClass("dashboard--large")){
                            Y.one(".wegas-dashboard")
                                    .removeClass("dashboard--medium")
                                    .removeClass("dashboard--small")                                    
                                    .removeClass("dashboard--extrasmall")                                    
                                    .addClass("dashboard--large");
                            Y.all(".card__title") 
                                .setStyle("width", "calc(100% - "+ ((Object.keys(custom.data).length * 65) + 346) +"px)");
                            Y.all(".card__blocs--monitoring")
                                .setStyle('width', ((Object.keys(custom.data).length * 65) + 2) + "px");
                        }
                    }else{
                        if(windowWidth >= limit.small){
                            if(!Y.one(".wegas-dashboard").hasClass("dashboard--medium")){
                                Y.one(".wegas-dashboard")
                                    .removeClass("dashboard--large")
                                    .removeClass("dashboard--small")
                                    .removeClass("dashboard--extrasmall")                                    
                                    .addClass("dashboard--medium");
                                Y.all(".card__title") 
                                    .setStyle("width", "calc(100% - 344px)");
                                Y.all(".card__blocs--monitoring")
                                    .setStyle('width', "100%")
                                    .setStyle('border-left', "none");
                            }
                        }else{
                            if(windowWidth >= limit.extrasmall){
                                if(!Y.one(".wegas-dashboard").hasClass("dashboard--small")){
                                    Y.one(".wegas-dashboard")
                                        .removeClass("dashboard--large")
                                        .removeClass("dashboard--medium")
                                        .removeClass("dashboard--extrasmall")
                                        .addClass("dashboard--small");
                                    Y.all(".card__title") 
                                        .setStyle("width", "calc(100% - 80px)");
                                    Y.all(".card__blocs--monitoring")
                                        .setStyle('width', "100%")
                                        .setStyle('border-left', "none");
                                }
                            }else{
                                if(!Y.one(".wegas-dashboard").hasClass("dashboard--extrasmall")){
                                    Y.one(".wegas-dashboard")
                                        .removeClass("dashboard--small")
                                        .addClass("dashboard--extrasmall");
                                    Y.all(".card__title") 
                                        .setStyle("width", "calc(100% - 80px)");
                                    Y.all(".card__blocs--monitoring")
                                        .setStyle('width', "100%")
                                        .setStyle('border-left', "none");
                                }
                            }
                        }
                    }
                }else{
                    if(Y.one(".wegas-dashboard").hasClass("dashboard--large")){
                        Y.one(".wegas-dashboard")
                            .removeClass("dashboard--large")
                            .removeClass("dashboard--medium")
                            .removeClass("dashboard--small")
                            .removeClass("dashboard--extrasmall");
                        Y.all(".card__title").setStyle("width", "calc(100% - "+ ((Object.keys(custom.data).length * 80) + 346) +"px)");
                        Y.all(".card__blocs--monitoring").setStyle('width', ((Object.keys(custom.data).length * 80) + 2) + "px");
                    }
                }
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
        bindUI: function() {},
        syncUI: function() {
            var gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(), 
                teams = Y.Wegas.Facade.Game.cache.getCurrentGame().get("teams"),
                resize = this._resizeCards,
                contentBox = this.get("contentBox"), custom;
            this._getCustomData(this.get("remoteScript")).then(function(res) {
                contentBox.empty();
                teams.forEach(function(team){
                    custom = null;
                    res.forEach(function(data){
                        if(data.id === team.get("id")){
                            custom = data;
                        }
                    });
                    if(team.get("@class") !== "DebugTeam" && team.get("players").length > 0){
                        new Y.Wegas.DashboardCard({
                            "team": team, 
                            "individually": gameModel.get("properties.freeForAll"),
                            "container": contentBox,
                            "custom": custom
                        });
                    }
                    Y.one(window).on("resize", function(e){
                        var windowWidth = e.target.get('winWidth');
                        resize(windowWidth, custom);

                    });
                    resize(window.innerWidth, custom);
                });
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
            tableCfg: {
                value: {
                    columns: []
                },
                getter: function(v) {
                    var clone = Y.clone(v), dashboard = Y.namespace("Wegas.Config.Dashboard"),
                        cols = Y.Lang.isFunction(dashboard) ? dashboard().columns : dashboard.columns;
                    clone.columns = clone.columns.concat(cols);
                    return clone;
                }
            },
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
