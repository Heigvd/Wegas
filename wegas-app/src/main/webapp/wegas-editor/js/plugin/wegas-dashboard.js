/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Ulvide <raph@hat-owl.cc>
 */        
YUI.add('wegas-dashboard-plugs', function(Y) {
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
});