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
YUI.add('wegas-teams-dashboard', function(Y) {
    "use strict";
    Y.Wegas.TeamsDashboard = Y.Base.create("wegas-teams-dashboard", Y.Wegas.Dashboard, [], {
        BOUNDING_TEMPLATE: "<div class='dashboard dashboard--teams' />",
        initializer: function(){
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(), cardsData = [],
                icon = game.get("properties.freeForAll") ? "user": "group",
                context = this;
            if(game && game.get("teams").length > 0){
                game.get("teams").forEach(function(team){
                    if(team.get("@class") !== "DebugTeam" && team.get("players").length > 0){
                        var data = {
                            id: team.get("id"),
                            title : game.get("properties.freeForAll") ? team.get("players")[0].get("name") : team.get("name"),
                            icon: icon,
                            blocs:context._getBlocs(team)
                        };
                        cardsData.push(data);
                    }
                });
                this.set("cardsData", cardsData);
            }
        },
        _getBlocs: function(team){
            var blocs = [];
            this._addActionsBlocs(blocs, team);
            this._addInfosBlocs(blocs, team);
            return blocs;
        },
        _addInfosBlocs: function(blocs, team){
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                bloc = {
                    "title": "Infos",
                    "type": "action",
                    "items":[{
                        "icon": "info-details",
                        "label": game.get("properties.freeForAll") ? "Notes" : "Notes and Players infos",
                        "do": function(){
                            new Y.Wegas.DetailsTeamModal({
                                team: team
                            }).render();
                        }
                    },{
                        "icon": "info-view",
                        "label": "View playing session",
                        "do": function(){
                            window.open("game-lock.html?id=" + team.get("players")[0].get("id"));
                        }
                    }]
                };
            
            blocs.push(bloc);
            this._addOriginalBloc(team.get("id"), bloc);                        
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
                }]
            };
            blocs.push(bloc);
            this._addOriginalBloc(team.get("id"), bloc);                        

        }
    });
    
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
});
