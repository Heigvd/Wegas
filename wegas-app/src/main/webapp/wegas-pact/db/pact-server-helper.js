var PactHelper = (function(){

    return {
        sendHistory: function(title, msg) {
            Variable.find(gameModel, "history").sendDatedMessage(self, "", "", title, msg);
        },
        sendMessage: function(from, title, msg){

            /**
             * Internal function: strips HTML tags from given input string, replacing them with spaces.
             */
            function strip_tags(input, allowed) {
                //  Taken from: http://phpjs.org/functions/strip_tags/
                allowed = (((allowed || '') + '')
                    .toLowerCase()
                    .match(/<[a-z][a-z0-9]*>/g) || [])
                    .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
                var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
                    commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
                return input.replace(commentsAndPhpTags, ' ')
                    .replace(tags, function($0, $1) {
                        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ' ';
                    });
            }

            var date = '',
                // To create a good token, strip HTML tags and non-ASCII characters:
                token = strip_tags(title.length > 0 ? title + ":" + msg : msg)
                        .replace(/[^ -~]+/g, "").trim().substr(0,64);
            Variable.getInstance(Variable.find(gameModel, "inbox"), self).sendMessage(from, title, msg, date, token, []);
        }
    };
}());
