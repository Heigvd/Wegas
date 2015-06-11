/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/*global Y, persistence */
(function() {
    "use strict";
    
    
    Y.use("wegas-inputex-variabledescriptorselect", function() {
        Y.mix(Y.inputEx.getFieldClass("statement").prototype.GLOBALMETHODS, {
            "LawHelper.nextClientInterview": {
                label: "[CorporateLaw] Next Interview",
                //className: "wegas-method-sendmessage",
                "arguments": []
            },
            "LawHelper.nextActionFolder": {
                label: "[CorporateLaw] Next Actions",
                //className: "wegas-method-sendmessage",
                "arguments": []
            },
            "LawHelper.submit": {
                label: "[CorporateLaw] Submit Input",
                //className: "wegas-method-sendmessage",
                "arguments": [{
                        type: "flatvariableselect",
                        typeInvite: "Object",
                        scriptType: "string",
                        classFilter: ["PeerReviewDescriptor"],
                        required: true
                    }]
            }
        });
    });
    
    
    Y.namespace("Wegas.Config").CustomImpacts = function() {
        return [
            ["Send Mail",
            'Variable.find(gameModel, "mailbox").sendMessage(${"type":"string", "label":"From"}, ${"type":"string", "label":"Subject"}, ${"type":"html", "label":"Body", "required":true}, []);'],
            'Variable.find(gameModel, "maitreDeStage").add(self, ${"type":"number", "label": "Maître de Stage"});',
            'Variable.find(gameModel, "satisfactionClient").add(self, ${"type":"number", "label": "Satisfaction Client"});',
            'Variable.find(gameModel, "budget").add(self, ${"type":"number", "label": "Budget"});'
        ];
    };
    Y.namespace("Wegas.Config").ExtraTabs = [{
            label: "Orchestrator",
            children: [{
                    type: "PageLoader",
                    pageLoaderId: "orchestrator",
                    defaultPageId: 10
                }]
        }];
}());
