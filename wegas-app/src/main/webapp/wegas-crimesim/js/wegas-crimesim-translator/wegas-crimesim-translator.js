YUI.add("wegas-crimesim-translator", function(Y) {

    function Translator() {
        this._strs = Y.Intl.get("wegas-crimesim-translator");
    }

    Translator.prototype = {
        constructor: Translator,
        getRB: function() {
            return this._strs;
        }
    };

    Y.namespace('Wegas').Translator = Translator;

});