/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */

(function() {
    "use strict";
    
    // var testScriptURL = Y.Wegas.app.get("base") + "rest/Editor/GameModel/" +  Y.Wegas.Facade.GameModel.get("currentGameModelId") + "/Library/Script?view=Export"
    var testScriptURL;
    
    testScriptURL = Y.Wegas.app.get("base") + "wegas-pmg/scripts/test-scripts/wegas-pmg-server-test-simplepmg.js";

    Y.use("wegas-inputex-variabledescriptorselect", function() {
         Y.io(testScriptURL, {on: {
            success: function(tId, transaction){
                var script = transaction.response, 
                    key, methods = {}, 
                    pmg_test = eval(script + "; PMGTest;");
                    
                    for (key in pmg_test){
                        methods["PMGTest." + key] = {label: "[PMGTest] " + key.replace(/^test/, "").replace(/([A-Z])/g, " $1"), "arguments" : []};
                    }
                    Y.mix(Y.inputEx.getFieldClass("statement").prototype.GLOBALMETHODS, methods);
            }
        }});
    });
}());
