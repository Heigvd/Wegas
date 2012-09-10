YUI.add("wegas-leaderway-translator", function(Y) {
 
    function Translator() {
        this._strs = Y.Intl.get("wegas-leaderway-translator");
    }
 
    Translator.prototype = {
        constructor : Translator,
 
        getRB : function() {
            return this._strs;
        }
    }
 
    Y.Translator = Translator;
 
});