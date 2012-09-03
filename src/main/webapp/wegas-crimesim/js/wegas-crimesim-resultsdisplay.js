/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-crimesim-resultsdisplay', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    ResultsDisplay;

    /**
     *  The results display class.
     */
    ResultsDisplay = Y.Base.create("wegas-crimesim-resultsdisplay", Y.Widget,
        [Y.Wegas.Widget, Y.WidgetChild], {

            // *** Fields *** /

            // *** Lifecycle Methods *** //
            renderUI: function () {
                this.datatable = new Y.DataTable({
                    columns: [{
                        key: "startTime",
                        //className: 'hidden',
                        label:"Period",
                        sortable:true,
                        className: "period"
                    }, {
                        key:"evidence",
                        label:"Pièce",
                        sortable:true
                    }, {
                        key:"analyis",
                        label:"Analyse",
                        sortable:true
                    }, {
                        key:"description",
                        label:"Description",
                        emptyCellValue: "no description",
                        className: "description"
                    }, {
                        key:"answer",
                        label:"Result"
                    }, {
                        key:"fileLinks",
                        label:"Files",
                        emptyCellValue: "no files"
                    }]
                });
                this.datatable.render(this.get( CONTENTBOX ));
            },

            bindUI: function () {
                this.handlers = {};
                this.handlers.response =                                        // If data changes, refresh
                Y.Wegas.app.dataSources.VariableDescriptor.after("response",
                    this.syncUI, this);

                this.handlers.playerChange =                                    // If current user changes, refresh (editor only)
                Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);
            },

            destructor: function () {
                this.datatable.destroy();

                for (var i in this.handlers) {
                    this.handlers[i].detach();
                }
            },

            syncUI: function () {
                while ( this.datatable.getRow( 0 ) ) {
                    this.datatable.removeRow( 0 );
                }
                this.datatable.addRows( this.genData() )
            },

            genData: function () {
                var i, j, k, questionInstance,  reply, replyData, status,
                questions = Y.Wegas.VariableDescriptorFacade.rest.find('name', "evidences").get("items"),
                data = [],
                responsesByStartTime = {},
                period = Y.Wegas.VariableDescriptorFacade.rest.find('name', "period"),
                periodInstance = period.getInstance(),
                currentTime = periodInstance.get( "value" ) - period.get( "minValue" );

                for ( i = 0; i < questions.length; i = i + 1 ) {
                    questionInstance = questions[i].getInstance();
                    for ( j = 0; j < questionInstance.get("replies").length; j = j + 1 ) {
                        reply = questionInstance.get("replies")[j];
                        replyData = Y.mix( reply.getAttrs(), reply.get( "result" ).getAttrs() );
                        status = reply.getStatus( currentTime);

                        replyData.evidence = questions[i].get( "name" );
                        replyData.analyis = reply.getChoiceDescriptor().get( "name" );
                        replyData.fileLinks = "";
                        replyData.startTime += 1;
                        for ( k = 0; k < replyData.files.length; k = k + 1 ) {
                            replyData.fileLinks += '<a href="' + Y.Wegas.app.get( "base") +
                            replyData.files[i] + '">' + replyData.files[i] + ''
                        }
                        if (!replyData.fileLinks) {
                            delete replyData.fileLinks;
                        }
                        if (!replyData.description) {
                            delete replyData.description;
                        }

                        if (status === 1) {
                            replyData.answer = "analysis in progress";
                        } else if (status === 2) {
                            replyData.answer = "analysis planified";
                        }

                        if (!responsesByStartTime[reply.get( "startTime" )]) {
                            responsesByStartTime[reply.get( "startTime" )] = [];
                        }
                        responsesByStartTime[reply.get( "startTime" )].push( replyData );
                    }
                }
                for ( i in responsesByStartTime ) {
                    data = data.concat( responsesByStartTime[i] );
                }
                return data;
            }
        });

    Y.namespace('Wegas').ResultsDisplay = ResultsDisplay;
});