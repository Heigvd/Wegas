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
    Y.Wegas.Dashboard = Y.Base.create("wegas-dashboard", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class='dashboard'></div>",
        ORIGINAL_BLOCS: [],
        renderUI: function(){
            if(this.toolbar) {
                this.toolbar.removeAll();
                this.toolbar.add(new Y.Wegas.Button({
                    label: '<span class="wegas-icon wegas-icon-refresh"></span> Refresh',
                    on: {
                        click: Y.bind(function() {
                            this.syncUI();
                        }, this)
                    }
                }));
            }
        },
        syncUI:function(){
            console.log("SYNC! BAM!");
            var context = this;
            context._getMonitoredData().then(function(monitoredBlocs){
                context.removeAll();
                context.get("cardsData").forEach(function(data){
                    context.add(new Y.Wegas.Card({
                        "title": data.title,
                        "icon": data.icon || null,
                        "blocs": context._combineBlocs(data, monitoredBlocs)
                    }));
                });
                if(context.get("resize")){
                    context.plug(Y.Wegas.CardsResizable);
                    context.CardsResizable.resetClassSize();
                    context.CardsResizable.resize();
                }
            });
        },
        _addOriginalBloc: function(idCard, originalBloc){
            if(!this.ORIGINAL_BLOCS[idCard]){
                this.ORIGINAL_BLOCS[idCard] = [];
            }
            this.ORIGINAL_BLOCS[idCard].push(originalBloc);                        
        },
        _resetToInitialBlocs: function(data){
            data.blocs = [];
            if(this.ORIGINAL_BLOCS[data.id]){
                this.ORIGINAL_BLOCS[data.id].forEach(function(bloc){
                    data.blocs.push(bloc);
                });
            }
        },
        _combineBlocs: function(data, monitoredBlocs){ 
            var blocs, newBlocs, newBloc;
            this._resetToInitialBlocs(data);
            console.log(data.blocs);
            blocs = data.blocs;
            if(monitoredBlocs !== null && monitoredBlocs.data && monitoredBlocs.data[data.id]){
                monitoredBlocs.structure.forEach(function(blocsToAdd){
                    newBlocs = {
                        "position": "left",
                        "type": "monitoring",
                        "items": []
                    };
                    blocsToAdd.title ? newBlocs.title = blocsToAdd.title : null;
                    blocsToAdd.items.forEach(function(bloc){
                       newBloc = {
                           label: bloc.label,
                           value: monitoredBlocs.data[data.id][bloc.label],
                           formatter : eval("("+ bloc.formatter + ")")
                       };
                       newBlocs.items.push(newBloc);
                   });
                   blocs.push(newBlocs);
                });
            }
            return blocs;
        },
        _getMonitoredData: function(){
            var dashboards = Y.namespace("Wegas.Config.Dashboards"), script;
            if(dashboards && this.get("name") && dashboards[this.get("name")]){
                script = dashboards[this.get("name")];
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
                return Y.Promise.resolve(null);
            }
        },
        initializer: function(){
            console.log("INIT DASH");
            var context = this;
            context.get("cardsData").forEach(function(data){
                if(data.blocs && data.blocs.length > 0){
                    context.get("cardsData").blocs.forEach(function(bloc){
                        context._addOriginalBloc(data.id, bloc);
                    });
                }
            });
        }
    },{
        "ATTRS":{
            "name":{
                value: null
            },
            "cardsData":{
                value : []  
            },
            "resize":{
                value: true
            }
        }
    }); 
});