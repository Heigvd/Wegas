/**
* @author Benjamin Gerber <ger.benjamin@gmail.com>
*/

YUI.add('wegas-leaderway-dialogue', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Dialogue;

    Dialogue = Y.Base.create("wegas-dialogue", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        
        chart: null,
        seriesName: new Array(),
        seriesValue:new Array(),
        handlers: new Array(),
        
        chartTooltip: {
            markerLabelFunction: function(categoryItem, valueItem, itemIndex, series, seriesIndex){
                var msg = document.createElement("div"),
                boldTextBlock = document.createElement("div");
                boldTextBlock.appendChild(document.createTextNode(valueItem.displayName+': '+valueItem.axis.get("labelFunction").apply(this, [valueItem.value])));   
                msg.appendChild(boldTextBlock); 
                return msg; 
            }
        },

        /***Particular Methode***/
        clear: function(cb){
            this.chart = null;
            this.seriesName.length = 0
            this.seriesValue.length = 0;
            cb.one('.chart').setHTML();
            cb.one('.dialogue .talk').setHTML();
            cb.one('.dialogue .response').setHTML();
        },
        createChart: function(resourceDescriptor){
            var resourceInstance = resourceDescriptor.getInstance(),
            seriesCollection = [
                {yDisplayName:'moral'},
                {yDisplayName:'confiance'}
            ],
            rawSeries = [
                resourceInstance.get('moralHistory'),
                resourceInstance.get('confidenceHistory'),
            ];
            
            
            this.chart = new Y.Chart({
                type:'combospline',
                seriesCollection:seriesCollection,
                axes:{
                    values:{
                        minimum:0,
                        maximum:100
                    }
                },
                legend: {
                    styles: {
                        gap:-5  
                    },
                    chart:this.chart,
                    position: "bottom",
                    width: 250,
                    height: 50
                },
                tooltip: this.chartTooltip,
                dataProvider:this.getChartValues(5, rawSeries), 
                horizontalGridlines: true,
                verticalGridlines: true
            });
            this.chart.render(".chart");
        },
          
        getChartValues: function(numberOfValues, rawSeries){
            var i, j, fitSeries = new Array(), serieRawData = new Array(), serieFitData = new Array();
            for(i=0; i<numberOfValues; i++){
                serieFitData.push(i);
            }
            fitSeries.push(serieFitData.slice());
            for(i=0; i<rawSeries.length; i++){
                serieRawData = rawSeries[i];
                serieFitData.length = 0;
                for(j=numberOfValues-1; j>=0; j--){
                    if(serieRawData.length-1<j){
                        serieFitData.push(serieRawData[0]);
                    }
                    else{
                        serieFitData.push(serieRawData[serieRawData.length-(j+1)]);
                    }
                }
                fitSeries.push(serieFitData.slice());
            }
            return fitSeries;
        },
        
        readStateMachine: function(cb){
            var dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", "dialogues"),
            state, text = new Array();
            if(dialogue == null){
                cb.one('.dialogue .talk').insert("Aucun dialogue n'est disponible.");
                return;
            }
            state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            text = state.text.split(new RegExp("[ ]+", "g"));
            cb.one('.dialogue .talk').insert('<p></p>');
            this.displayText(cb, text);
        },
        
        displayText: function(cb, text){
            cb.one('.dialogue .talk p').insert(text[0]+'&nbsp');
            text.shift();
            if(text.length > 0){
                setTimeout(Y.bind(this.displayText, this, cb, text), 100);
            }
            else{
                this.displayResponse(cb);
            }
        },
        
        displayResponse: function(cb){
            var i, state, context = this,
            dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", "dialogues");
            state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            cb.one('.dialogue .response').insert('<ul class="responseElement"></ul>');
            for(i=0 ; i<state.get('transitions').length; i++){
                cb.one('.dialogue .response .responseElement').insert('<li nextState="'+state.get('transitions')[i].get('nextStateId')+'">'+state.get('transitions')[i].get('actionText')+'</li>');
            }
            /*delegate here ! */cb.all('.dialogue .response .responseElement li').on('click', function (e){
                dialogue.getInstance().get('currentStateId') = this.getAttribute('nextState')[0];
                context.syncUI();
            });
        },
        
        /***Lifecycle methode***/
        renderUI: function (){
            var cb = this.get(CONTENTBOX);
            cb.setContent(
                '<div class="pictures"></div>'
                +'<div style="width: 250px; height: 200px;" class="chart"></div>'
                +'<div class="speaker-name">Leader</div>'
                +'<div class="dialogue"><div class="talk"></div><div class="response"></div></div>'
                );
            cb.all('.menu ').hide();
        },
          
        bindUI: function(){
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
        },
          
        syncUI: function () {
            var cb = this.get(CONTENTBOX);
            var listResourceDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "resources");
            if(listResourceDescriptor == null) return;
            this.clear(cb);
            this.createChart(listResourceDescriptor.get('items')[0]);
            this.readStateMachine(cb);
        },
        
        destroy: function(){
            var i, cb = this.get(CONTENTBOX);
            cb.all('.menu div').show();
            this.chart().destroy();
            this.tabview.destroy();
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        }
        
    }, {
        ATTRS : {}
    });

    Y.namespace('Wegas').Dialogue = Dialogue;
});