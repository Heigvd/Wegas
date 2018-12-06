var PactHelper = (function(){

    return {
        sendHistory: function(title, msg) {
            Variable.find(gameModel, "history").sendDatedMessage(self, "", "", title, msg);
        },
        sendMessage: function(from, title, msg){
            Variable.find(gameModel, "inbox").sendDatedMessage(self, from, "", title, msg);
        }
    };
}());
