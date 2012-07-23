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
        clear: function(){
            this.chart = null;
            this.seriesName.length = 0
            this.seriesValue.length = 0;
            Y.one('.wegas-dialogue .chart').setHTML();
            Y.one('.wegas-dialogue .dialogue .talk').setHTML();
            Y.one('.wegas-dialogue .dialogue .response').setHTML();
        },
        createChart: function(resourceDescriptor){
            var resourceInstance = resourceDescriptor.getInstance(),
            seriesCollection = [
                {yDisplayName:'moral'},
                {yDisplayName:'confiance'}
            ],
            rawSeries = [
                resourceInstance.get('MoralHistory'),
                resourceInstance.('getConfidenceHistory'),
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
        
        readStateMachine: function(){
            var dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", "dialogues"),
            state, text = new Array();
            if(dialogue == null){
                Y.one('.wegas-dialogue .dialogue .talk').insert("Aucun dialogue n'est disponible.");
                return;
            }
            state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            text = state.text.split(new RegExp("[ ]+", "g"));
            Y.one('.wegas-dialogue .dialogue .talk').insert('<p></p>');
            this.displayText(text);
        },
        
        displayText: function(text){
            Y.one('.wegas-dialogue .dialogue .talk p').insert(text[0]+'&nbsp');
            text.shift();
            if(text.length > 0){
                setTimeout(Y.bind(this.displayText, this, text), 100);
            }
            else{
                this.displayResponse();
            }
        },
        
        displayResponse: function(){
            var i, dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", "dialogues"),
            state, context = this;
            state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            Y.one('.wegas-dialogue .dialogue .response').insert('<ul class="responseElement"></ul>');
            for(i=0 ; i<state.get('transitions').length; i++){
                Y.one('.wegas-dialogue .dialogue .response .responseElement').insert('<li nextState="'+state.get('transitions')[i].get('nextStateId')+'">'+state.get('transitions')[i].get('actionText')+'</li>');
            }
            Y.all('.wegas-dialogue .dialogue .response .responseElement li').on('click', function (e){
                dialogue.getInstance().get('currentStateId') = this.getAttribute('nextState')[0];
                context.syncUI();
            });
        },
        
        /***Lifecycle methode***/
        renderUI: function (){
            this.get(CONTENTBOX).setContent(
                '<div class="pictures"></div>'
                +'<div style="width: 250px; height: 200px;" class="chart"></div>'
                +'<div class="speaker-name">Leader</div>'
                +'<div class="dialogue"><div class="talk"></div><div class="response"></div></div>'
                );
            Y.all('.menu ').hide();
        },
          
        bindUI: function(){
            Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this);
            Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
        },
          
        syncUI: function () {
            var listResourceDescriptor = Y.Wegas.VariableDescriptorFacade.rest.find("name", "resources");
            if(listResourceDescriptor == null) return;
            this.clear();
            this.createChart(listResourceDescriptor.get('items')[0]);
            this.readStateMachine();
        },
        
        destroy: function(){
            Y.all('.menu div').show();
        }
        
    }, {
        ATTRS : {
        }
    });

    Y.namespace('Wegas').Dialogue = Dialogue;
});