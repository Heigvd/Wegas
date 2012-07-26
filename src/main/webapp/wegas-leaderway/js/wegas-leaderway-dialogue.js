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
        currentDialogue: "dialogueLucien", //debug
        
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
            cb.one('.pictures .backgroundLayer').setHTML();
            cb.one('.pictures .questionLayer').setHTML();
            cb.one('.pictures .answerLayer').setHTML();
            cb.one('.chart').setHTML();
            cb.one('.speaker-name').setHTML();
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
            var dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.currentDialogue),
            state, rawText, jsonText, texts, splittedText = new Array();
            if(dialogue == null){
                cb.one('.dialogue .talk').insert("Aucun dialogue n'est disponible.");
                return;
            }
            cb.one('.pictures .backgroundLayer').hide();
            cb.one('.pictures .questionLayer').hide();
            cb.one('.pictures .answerLayer').hide();
            state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            rawText = state.get('text');
            jsonText = JSON.parse(rawText);
            texts = jsonText.texts[Math.floor(Math.random()*jsonText.texts.length)];
            splittedText = texts.split(new RegExp(" ", "g"));
            cb.one('.speaker-name').setHTML(jsonText.speakerName);
            cb.one('.dialogue .talk').insert('<p></p>');
            this.renderJSONImages(cb.one('.pictures .backgroundLayer'), jsonText.backgroundImages);
            this.renderJSONImages(cb.one('.pictures .questionLayer'), jsonText.questionImages);
            this.renderJSONImages(cb.one('.pictures .answerLayer'), jsonText.answerImages);
            cb.one('.pictures .backgroundLayer').show();
            cb.one('.pictures .questionLayer').show();
            setTimeout(Y.bind(this.displayText, this, cb, splittedText), 500);
        },
        
        renderJSONImages: function(node, imageObjects){
            var i, key, imageHTML = new Array();
            for(i=0; i<imageObjects.length; i++){
                imageHTML.push('<img src="');
                imageHTML.push(imageObjects[i].link);
                imageHTML.push('" ');
                if(imageObjects[i].height){
                    imageHTML.push('height="');
                    imageHTML.push(imageObjects[i].height);
                    imageHTML.push('" ');     
                } 
                if(imageObjects[i].width){
                    imageHTML.push('width="');
                    imageHTML.push(imageObjects[i].width);
                    imageHTML.push('" ');   
                }
                imageHTML.push('style="');
                imageHTML.push('position:absolute;');
                for (key in imageObjects[i].css){
                    imageHTML.push(key);
                    imageHTML.push(':');
                    imageHTML.push(imageObjects[i].css[key]);
                    imageHTML.push('; ');                       
                }
                imageHTML.push('" />'); 
                node.insert(imageHTML.join(""));
            }
        },
        
        displayText: function(cb, textParts){
            cb.one('.dialogue .talk p').insert(textParts[0]+' &thinsp;');
            textParts.shift();
            if(textParts.length > 0){
                setTimeout(Y.bind(this.displayText, this, cb, textParts), 70);
            }
            else{
                this.displayResponse(cb);
            }
        },
        
        displayResponse: function(cb){
            var i, state, dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.currentDialogue);
            cb.one('.pictures .questionLayer').hide();
            cb.one('.pictures .answerLayer').show();
            state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            cb.one('.dialogue .response').insert('<ul class="responseElements"></ul>');
            for(i=0 ; i<state.get('transitions').length; i++){
                cb.one('.dialogue .response .responseElements').insert('<li nextState="'+state.get('transitions')[i].get('nextStateId')+'">'+state.get('transitions')[i].get('actionText')+'</li>');
            }
            cb.one('.dialogue .response .responseElements').delegate('click', function (e){
                   dialogue.doTransition(state.get('transitions')[0]);
            }, 'li', this);
        },
        
        setCurrentDialogue: function(newDialogueRef){
            this.currentDialogue = newDialogueRef;
        },
        
        /***Lifecycle methode***/
        renderUI: function (){
            var cb = this.get(CONTENTBOX);
            cb.setContent(
                '<div class="pictures">\n\
                    <div class="backgroundLayer" style="absolute"></div>\n\
                    <div class="questionLayer" style="absolute"></div>\n\
                    <div class="answerLayer" style="absolute"></div>\n\
                 </div>\n\
                 <div style="width: 250px; height: 200px;" class="chart"></div>\n\
                 <div class="speaker-name"></div>\n\
                 <div class="dialogue"><div class="talk"></div><div class="response"></div></div>'
                );
            if(this.get('toHide')){
                Y.all(this.get('toHide')).hide();   
            }
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
            this.chart.destroy();
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        }
        
    }, {
        ATTRS : {
            toHide:{}
            
        }
    });

    Y.namespace('Wegas').Dialogue = Dialogue;
});