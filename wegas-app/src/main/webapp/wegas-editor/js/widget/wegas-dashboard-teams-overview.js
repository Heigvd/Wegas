/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Wegas Team Dashboard - Extends of Basic Dashboard
 * @author Raphaël Schmutz <raph@hat-owl.cc>
 */
YUI.add('wegas-teams-overview-dashboard', function(Y) {
    "use strict";
    
    Y.Wegas.TeamsOverviewDashboard = Y.Base.create("wegas-teams-overview-dashboard", Y.Wegas.TeamsDashboard, [], {
        BOUNDING_TEMPLATE: "<div class='dashboard dashboard--teams-overview' />",
        initializer: function(){
            var teams = Y.Wegas.Facade.Game.cache.getCurrentGame().get("teams"),
                context = this;
            this.get("cardsData").forEach(function(data){
                teams.forEach(function(team){
                    if(team.get("id") == data.id){
                        data.blocs = context._getBlocs(team);
                    }
                });
            });
        },
        syncUI: function(){
            this._createCards().then(function(){
                Y.all(".wrapper--card").each(function(elem){
                    var widget = Y.Widget.getByNode(elem);
                    widget.plug(Y.Wegas.TeamCardDetails);
                });
            });
        },
        _getBlocs: function(team){
            var blocs = [];
            this._addActionsBlocs(blocs, team);
            this._addInfos(blocs, team);
            return blocs;
        },
        _addInfos: function(blocs, team){
            //this._addOriginalBloc(team.get("id"), bloc);                        
        },
        _addActionsBlocs: function(blocs, team){
            var bloc = {
                "title": "Actions",
                "type": "action",
                "items":[{
                    "icon": "action-impacts",
                    "label": "Impacts",
                    "do": function(){
                        new Y.Wegas.ImpactsTeamModal({
                            "team":team
                        }).render();
                    }
                },{
                    "icon": "action-email",
                    "label": "Send real E-Mail",
                    "do": function(){
                        new Y.Wegas.EmailTeamModal({
                            "team": team,
                            "on": {
                                "email:sent": function() {
                                    this.close();
                                }
                            }
                        }).render();
                    }
                },{
                    "icon": "info-view",
                    "label": "View playing session",
                    "do": function(){
                        window.open("game-lock.html?id=" + team.get("players")[0].get("id"), "_blank");
                    }
                }]
            };
            blocs.push(bloc);
            this._addOriginalBloc(team.get("id"), bloc);                        
        }
    });
    
    Y.Wegas.TeamCardDetails = Y.Base.create("wegas-team-card-details", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], { 
        BASE_TEMPLATE:  "<div class='wrapper__quick-access quick-access--close'>"+
                            "<a href='#' class='quick-access__link quick-access__link--open'>Details <i class='fa fa-expand fa-rotate-90'></i></a>"+
                            "<a href='#'  class='quick-access__link quick-access__link--close'><i class='fa fa-compress fa-rotate-90'></i></a>"+
                            "<div class='quick-access__notes'><textarea class='infos-comments' placeholder='Enter a comment here'></textarea></div>"+
                        "</div>",
        TEAM_LIST_TEMPLATE: "<div class='quick-access__players'>"+
                                "<h3>Players</h3>"+
                                "<ul class='quick-access__players__list'></ul>"+
                            "</div>",      
        PLAYER_TEMPLATE: "<li class='quick-access__player'></li>",
        initializer: function(){
            var context = this,
                base, teamList, game;
            this.afterHostEvent("render", function(event){
                game = Y.Wegas.Facade.Game.cache.getCurrentGame();
                game.get("teams").forEach(function(team){
                    if(context.get("host").get("id") == team.get("id")){
                       context.set("team", team);
                    }
                });
                base = Y.Node.create(this.BASE_TEMPLATE);
                context.get("host").get("boundingBox").append(base);
                if(!game.get("properties.freeForAll")){
                    base.addClass("quick-access--team");
                    teamList = Y.Node.create(this.TEAM_LIST_TEMPLATE);
                    context.get("team").get("players").forEach(function(player){
                        var player = Y.Node.create(context.PLAYER_TEMPLATE).append(player.get("name"));
                        teamList.one(".quick-access__players__list").append(player);
                    });
                    base.append(teamList);
                }
                
                tinyMCE.init({
                    "width": "100%",
                    "height": "100%",
                    "menubar":false,
                    "statusbar": false,
                    "toolbar": "bold italic | alignleft aligncenter alignright alignjustify | bullist numlist",
                    "selector":'.infos-comments',
                    "setup": function (mce) {
                        mce.on('init', function(args) {
                            context.set("editor", args.target);
                            if(context.get("team").get("notes")){
                                context.get("editor").setContent(context.get("team").get("notes"));
                            }else{
                                context.get("editor").setContent("You can write notes here");
                            }
                        });
                        mce.on('change', function(e) {
                            console.log('change event', e);
                        });
                    }
                });
                
                base.delegate("click", function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    base.addClass("quick-access--open");
                    base.removeClass("quick-access--close");
                }, ".quick-access__link--open", this);
                
                base.delegate("click", function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    base.removeClass("quick-access--open");
                    base.addClass("quick-access--close");
                }, ".quick-access__link--close", this);
            });
        }
    }); 
    Y.Wegas.TeamCardDetails.NS = "TeamCardDetails";
    
    Y.Wegas.DetailsTeamModal = Y.Base.create("wegas-details-team-modal", Y.Wegas.Modal, [],{
        initializer: function(){
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                actions;
            if(game && team){
                actions = [{
                    "types": ["primary"],
                    "label": "Save", 
                    "do": function(){
                        if (team.get("notes") !== this.item(0).getNote()) {
                            team.set("notes", this.item(0).getNote());
                            Y.Wegas.Facade.Game.cache.put(team.toObject("players"), {});
                        }
                    }
                },{
                    "label": "Cancel", 
                    "do": function(){
                        this.close();
                    }
                }];
                this.set("title",   game.get("properties.freeForAll") 
                                    ? "Infos - Player \"" + team.get("players")[0].get("name") + "\"" 
                                    : "Infos - Team \"" + team.get("name") + "\"");
                this.set("icon",    game.get("properties.freeForAll") ? "user" : "group");
                this.add(new Y.Wegas.TeamDetails({
                    team: team
                }));
                this.set("actions", actions);
            }
        }
    },{
        "ATTRS":{
            "team": {}
        }   
    });
    
   
    
    Y.Wegas.ImpactsTeamModal = Y.Base.create("wegas-impacts-team-modal", Y.Wegas.Modal, [],{
        initializer: function(){
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                actions;
        
            if(game && team){
                actions = [{
                    "types": ["primary"],
                    "label": "Apply impact", 
                    "do": function(){
                        this.item(0).run(this);
                    }
                },{
                    "label": "Cancel", 
                    "do": function(){
                        this.close();
                    }
                },{
                    "label": "View src",
                    "types": ["secondary", "advanced"],
                    "do": function(){
                         this.item(0).viewSrc();
                    }
                }];
                this.set("title",   game.get("properties.freeForAll") 
                                    ? "Impact player \"" + team.get("players")[0].get("name") + "\"" 
                                    : "Impact team \"" + team.get("name") + "\"");
                this.add(new Y.Wegas.CustomConsole({
                    player: team.get("players")[0],
                    statusNode: Y.Node.create("<span></span>")
                }));
                this.set("actions", actions);
            }
        }
    },{
        "ATTRS":{
            "team": {}
        }
    });
    
    Y.Wegas.EmailTeamModal = Y.Base.create("wegas-email-team-modal", Y.Wegas.Modal, [],{
        initializer: function(){
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                team = this.get("team"),
                actions;
        
            if(game && team){
                actions = [{
                    "types":["primary"],
                    "label": "Send",
                    "do": function(){
                        this.item(0).send();
                    }
                },{
                    "label": 'Cancel',
                    "do": function(){
                        this.close();
                    }
                }];
                this.set("title",   game.get("properties.freeForAll")
                                    ? "Send real E-Mail to player \"" + team.get("players")[0].get("name") + "\"" 
                                    : "Send real E-Mail to players of team \"" + team.get("name") + "\"");
                this.set("icon",    game.get("properties.freeForAll") ? "user" : "group");
                this.add(new Y.Wegas.SendMail({
                    "players": team.get("players"),
                    "statusNode": Y.Node.create("<span></span>")
                }));
                this.set("actions", actions);
            }
        }
    },{
        "ATTRS":{
            "team": {}
        }
    });
    
    Y.Wegas.TeamDetails = Y.Base.create("wegas-team-details", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
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
                "setup": function (mce) {
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
});
