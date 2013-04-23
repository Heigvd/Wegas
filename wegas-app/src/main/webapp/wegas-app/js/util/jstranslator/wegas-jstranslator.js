YUI.add("wegas-jstranslator", function(Y) {

    function JSTranslator() {
        this._strs = Y.Intl.get("wegas-jstranslator");
    }

    JSTranslator.prototype = {
        constructor: JSTranslator,
        getRB: function() {
            return this._strs;
        }
    };

    Y.namespace('Wegas').JSTranslator = JSTranslator;
});