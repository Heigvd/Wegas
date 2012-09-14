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
        currentDialogue: null,
        resourceDescriptor : null,
        isDisplayingAResponse:false,
        availableActions:null,
        state:null,
        
        /**
         *Create tooltips for the chart's values
         */
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
        /**
         * Clear each node created in the renderUI function
         * Delete the chart too.
         * @param String cb, the widget's contentbox.
         */
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
        
        /**
         * Creat a YUI3 Charts combospline' with values of a resource's moral and confidence historic values.
         * If any resource is given, the chart will be not created.
         * @ Param ResourceDescriptor resourceDescriptor, the source of chart's values
         */
        createChart: function(resourceDescriptor){
            if(this.chart) this.chart.destroy();
            if(!resourceDescriptor) return;
            var i, resourceInstance = resourceDescriptor.getInstance(),
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
                        gap:0
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
          
        /**
         * Create series for the chart.
         * i = numberOfValues
         * For each series, If number of values is smaller than i, copy the last value to create a serie with i values.
         * If number of values is greater than i, keep only the i last values.
         * @param Integer numberOfValues, the number of value wanted in the series.
         * @param Array rawSeries, an array of array of Integer.
         */
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
        
        /**
         * Read a dialogue corresponding with the current dialogue value in this widget.
         * if current state is empty, doTransition with the first available actions.
         * else if state contain JSON with param "subPageId" and "targetPageLoaderId", call the function "displayWidget()" in this widget.
         * else, the JSON can contain a array of text (one will be randomly choosed), one string correspnding of a param "speakerName",
         * a object "backgroundImages", an onject "questionImages" and a object "answerImages".
         * backgroundImages is always displayed.
         * questionImages is displayed during the display of the text then hidden if answerImages exist
         * answerImages is displayed when the text is completely displayed.
         * For more information about object image, read comments on the function "renderJSONImages()" in this widget.
         * Display text after 400 milisecondes.
         * hide the layer "answerImage".
         *@param String cb, the widget's contentbox.
         */
        readStateMachine: function(cb){
            //Read state
            var dialogue;
            if(!this.currentDialogue) return;
            dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.currentDialogue);
            if(!dialogue){
                cb.one('.dialogue .talk').insert("Aucun dialogue n'est disponible.");
                return;
            }
            cb.one('.pictures .backgroundLayer').hide();
            cb.one('.pictures .questionLayer').hide();
            cb.one('.pictures .answerLayer').hide();
            cb.one('.response').hide();
            this.state = dialogue.get('states')[dialogue.getInstance().get('currentStateId')];
            this.state.once('actionsAvailable', this.readStateContent, this)
            this.state.getAvailableActions();
        },
        
        readStateContent: function(e){
            var dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.currentDialogue),
            content, rawContent, texts, splittedText = new Array(), cb = this.get(CONTENTBOX);
            //get availableActions
            this.availableActions = e.actionsAvailable;
            rawContent = this.state.get('text');
            //Do semi-auto transition
            if(!rawContent || rawContent.length === 0){
                dialogue.doTransition(this.availableActions[0]);
                return;
            }
            //Change widget (exit dialogue)
            content = JSON.parse(rawContent);
            if(content.subPageId && content.targetPageLoaderId){
                this.displayWidget(dialogue, content); 
                return;
            }
            //Preparing texte
            this.isDisplayingAResponse = true;
            texts = content.texts[Math.floor(Math.random()*content.texts.length)];
            //while(texts.indexOf('&code') != -1){ don't do this !!! out of memory exception.
            if(texts.indexOf('&code') != -1){
                splittedText.push(texts.substring(0, texts.indexOf('&code')));
                texts = texts.substring(texts.indexOf('&code')+5)
                try{
                    splittedText.push(eval(texts.substring(0, texts.indexOf('&code'))));
                } catch(e){
                    console.log("unable to eval script");
                }
                texts = texts.substring(texts.indexOf('&code')+5);
                splittedText.push(texts);
                texts = splittedText.join("");
            }
            splittedText = texts.split(new RegExp(" ", "g"));
            cb.one('.speaker-name').setHTML(content.speakerName);
            cb.one('.dialogue .talk').insert('<p></p>');
            //Display image
            if(content.backgroundImages) this.renderImages(cb.one('.pictures .backgroundLayer'), content.backgroundImages);
            if(content.questionImages){
                this.renderImages(cb.one('.pictures .questionLayer'), content.questionImages);
                (content.answerImages)? this.renderImages(cb.one('.pictures .answerLayer'), content.answerImages) :  this.renderImages(cb.one('.pictures .answerLayer'), content.questionImages);
            }
            cb.one('.pictures .backgroundLayer').show();
            cb.one('.pictures .questionLayer').show();
            //Display text
            setTimeout(Y.bind(this.displayText, this, cb, splittedText), 400);
        },
        
        /**
         * Destroy this widget and open a newer corresponding to the subPageId at place defined by the targetPageLoaderId.
         * A function can be evaluated after the transition if the JSON contain a param "functionAfterTransition";
         * Show the node corresponding to the "toHide" ATTRS of this widget. 
         * @param Dialogue dialogue, the readed dialogue.
         * @param Object content, a object with obligatory param "targetPageLoaderId" and "subPageId" and a non-obligatory param "functionAfterTransition"
         */
        displayWidget: function(dialogue, content){
            if(content.subPageId && content.targetPageLoaderId){
                var targetPageLoader = Y.Wegas.PageLoader.find(content.targetPageLoaderId);
                targetPageLoader.once("widgetChange", function(e) {
                    if(content.functionAfterTransition){
                        try{
                            eval(content.functionAfterTransition);
                        }
                        catch(e){
                            console.log('unable to execute function : '+content.functionAfterTransition)
                        }
                    }
                });
                dialogue.doTransition(this.availableActions[0]);
                if(this.get('toHide')) Y.all(this.get('toHide')).show();   
                targetPageLoader.set("pageId", content.subPageId);
            }
        },
        
        /**
         * Insert a image to the DOM with given parametre
         * @param Node node, node where the image must be render.
         * @param Array[Object] imageObject, a array of objects. Each object can contain a link, an possible height, a possible width, a possible array named "css"  with css properties.
         */
        renderImages: function(node, imageObjects){
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
        
        /**
         * Recursive function that display text each 70 milisseconde in the ".dialogue .talk p" node of this widget.
         * call the function "displayResponse" when all the text is displayed.
         * @param String cb, the widget's contentbox.
         * @param Array[String] textParts, an array with a splitted string.  
         */
        displayText: function(cb, textParts){
            cb.one('.dialogue .talk p').insert(textParts[0]+' &thinsp;');
            textParts.shift();
            if(textParts.length > 0){
                setTimeout(Y.bind(this.displayText, this, cb, textParts), 70);
            }
            else{
                cb.one('.pictures .questionLayer').hide();
                cb.one('.pictures .answerLayer').show();
                this.displayResponse();
            }
        },
        
        /**
         * Show all available transitions for the current state.
         * hide the .questionLayer and sho the .answerLayer to display images.
         * @param Event object containing actionsAvailable (available transitions)
         */
        displayResponse: function(e){
            var i, cb = this.get(CONTENTBOX);
            if(this.availableActions == null) return
            this.isDisplayingAResponse = false;
            cb.one('.dialogue .response').insert('<ul class="responseElements"></ul>');
            for(i=0 ; i<this.availableActions.length; i++){
                cb.one('.dialogue .response .responseElements').insert('<li response_no="'+i+'">'+this.availableActions[i].get('actionText')+'</li>');
            }
            cb.one('.response').show();
        },
        
       /**
         * If current dialogue is null or empty, get the defaultDialogue value.
         * id defaultDialogue value doesn't exist, current dialogue will be null.
         */
        getDefaultDialogue: function(){
            var dialogue;
            if(!this.currentDialogue || this.currentDialogue.length === 0){
                dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", 'defaultDialogue').getInstance().get('value');
                if(dialogue && !dialogue.length == 0)this.currentDialogue = dialogue;
            }
        },
        
        /**
         * Set the current dialogue and search the resource owner of this new dialogue.
         * If a resource is finded, set the resourceDescriptor of this widget.
         * call the function syncUI of this widget.
         * @param String newDialogueRef, the new DialogueDescriptor's name 
         */
        setCurrentDialogue: function(newDialogueRef){
            var i, listResource = Y.Wegas.VariableDescriptorFacade.rest.find("name", 'resources'),
            resourceDescriptor;
            if(typeof newDialogueRef === "string"){
                this.currentDialogue = newDialogueRef;
            }
            else{
                this.getDefaultDialogue();
            }
            this.resourceDescriptor = null;
            for(i=0 ; i<listResource.get('items').length ; i++){
                resourceDescriptor = listResource.get('items')[i];
                if(resourceDescriptor.getInstance().get('properties').dialogue == this.currentDialogue){
                    this.resourceDescriptor = resourceDescriptor;
                    break;
                }
            }
            this.syncUI();
        },
        
        /**
         * Set the resourceDescriptor used by this widget. 
         * if the new resource have a dialogue set the current dialogue used by this widget.
         * @param ResourceDescriptor resourceDescriptor, the new resourceDescriptor
         */
        setResourceDescriptor: function(resourceDescriptor){
            if(!resourceDescriptor) return;
            var dialogue = resourceDescriptor.getInstance().get('properties').dialogue;
            if(!dialogue){
                this.currentDialogue = dialogue;
            }
            this.syncUI();
        },
        
        /***Lifecycle methode***/
        /**
         * Render the widget.
         * Hide node corresponding to the ATTRS "toHide"  
         */
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
        },
        
        /**
         * Bind some function at nodes of this widget
         */
        bindUI: function(){
            var cb = this.get(CONTENTBOX);
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
            this.handlers.push(cb.one('.dialogue .response').delegate('click', function (e){
                var dialogue = Y.Wegas.VariableDescriptorFacade.rest.find("name", this.currentDialogue);
                dialogue.doTransition(this.availableActions[parseInt(e.currentTarget._node.attributes[0].nodeValue)]);
            }, '.responseElements li', this));
        },
          
        /**
         * Synchronise the content of this widget.
         * Recreat the chart widget
         */
        syncUI: function () {
            var cb = this.get(CONTENTBOX);
            if(!this.isDisplayingAResponse){
                this.clear(cb);
                this.createChart(this.resourceDescriptor);
                this.readStateMachine(cb);
            } 
        },
        
        /*
         * Destroy all child widget and all function
         */
        destroy: function(){
            var i, cb = this.get(CONTENTBOX);
            cb.all('.menu div').show();
            this.chart.destroy();
            for (i=0; i<this.handlers.length;i++) {
                this.handlers[i].detach();
            }
        },
        
        // *** hack Methods *** //
        /**
         * if current week > max value of week value, then
         * change the current widget to go on the "dialogue" widget.
         */
        goToFinalPage: function(){
            var currentWeek = Y.Wegas.VariableDescriptorFacade.rest.find("name", "week");
            var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            if(parseInt(currentWeek.getInstance().get('value')) > currentWeek.get('maxValue')){
                targetPageLoader.once("widgetChange", function(e) {
                    e.newVal.setCurrentDialogue();
                });
                targetPageLoader.set("pageId", this.get('dialoguePageId'));    
            }
        }
        
    }, {
        ATTRS : {
            toHide:{
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            dialoguePageId: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            },
            targetPageLoaderId: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    Y.namespace('Wegas').Dialogue = Dialogue;
});