import { css } from "@emotion/css";

export const findAndReplaceStyle = css({

    '.find-result-entry' : {
        //marginLeft: '10px',
        marginTop: '20px',
        '.find-result-entry-title': {
            fontWeight: "bolder",
            fontSize: '15px',
            textDecoration: 'underline',
            userSelect: 'none'
        },
        '.find-result-entry-sidebyside': {
            display: "flex",
            flexDirection : 'row',
        
            '.find-result-entry-old, .find-result-entry-new' : {
                flexGrow : 1
            },
        },
        '.find-result-entry-diff':{
            
            '.editOldInline' : {
                backgroundColor: 'lightpink',
                textDecorationLine: 'line-through',
                textDecorationThickness : '1px'
            },
            '.editNewInline' : {
                backgroundColor: 'lightblue',
                fontWeight: 'bolder'
            },
            '.find-result-entry-number':{
                display: 'none'
            },
            '&.show-lines': {
                '.find-result-entry-number' :{
                    display: 'inline-block',
                    textAlign: 'right',
                    width: '20px',
                    fontStyle:'italic',
                    color: '#a2a2a2',
                    backgroundColor: '#f0f0f0',
                    userSelect: 'none'
                },
                '.find-result-entry-skip': {
                    marginLeft: '42px'
                }
            },
            '.find-result-entry-skip' : {
                fontStyle : 'italic',
                color: '#666',
                userSelect : 'none'
            }
        },
        '.find-result-entry-line':{
            marginLeft : '20px'
        },

    },

    'h4.find-result-waiting': {
        fontStyle : "italic",
    },
    'h4.find-result-empty': {
        fontStyle : "italic",
        backgroundColor : 'pink'
    }

})