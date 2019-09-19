/* global Y */

app.once("render",
    function() {
        "use strict";

        /*
         *  Custom error message when exceeding available time budget:
         *  ==========================================================
         *  Catch "out of bounds" exceptions on the time variable to display a custom error message:
         */
        Y.Wegas.Facade.Variable.on("WegasOutOfBoundException", Y.bind(function(e) {
            if (e.variableName === "time") {
                Y.Wegas.Alerts.showMessage("warn", Y.Wegas.Facade.Variable.cache.find("name", "messageNoTime")
                    .getValue());
                e.halt();
            }
        }, this));

        Y.Wegas.MBenefitsHelper = Y.Wegas.MBenefitsHelper || {};

        Y.Wegas.MBenefitsHelper.getSympathyLevel = function(sympathy) {
            if (Y.Lang.isNumber(sympathy)) {
                return +Math.floor((Math.max(0, Math.min(100, sympathy)) / 10));
            }

            return "no";
        };

        Y.use('wegas-mbenefits-css', function() {});
    }
);


app.on("beforeReset", function() {
    "use strict";

    var pageLoader = Y.Wegas.PageLoader.find('maindisplayarea');

    if (pageLoader) {
        pageLoader.set("pageId", 9);
    }
});