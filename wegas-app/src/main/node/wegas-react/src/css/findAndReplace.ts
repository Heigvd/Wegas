import { css } from "@emotion/css";

export const findAndReplaceStyle = css({
    /* Find & Replace */

    '.find-result-entry' : {
        marginLeft: '10px',
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
                textDecoration: 'lineTrough'
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

    },


//   .find-result-entry-diff .find-result-entry-line,
//   .find-result-entry-diff .find-result-entry-skip{
//     margin-left:20px;
// }

//   .find-result-entry-diff .find-result-entry-skip{
//     font-style: italic;
//     color: #666;
//     user-select: none;
// }

// -widget-content .actions{
//     margin: 10px;
// }

// -widget-content .actions .execute{
//     display: inline-block;
//     background-color: #4a4a4a;
//     color:white;
//     cursor: pointer;
//     padding: 10px;
// }


// .panel-inner -widget {
//     height : 100%;
// }

// .panel-inner -widget-content {
//     height : 100%;
//     display: flex;
//     height: 100%;
//     flex-direction: column;
// }

// .panel-inner -widget .widget {
//     flex-grow:1;
//     position:relative;
//     overflow: auto;
// }
// .panel-inner -widget .widget > div {
//     position: absolute;
//     top:0;
//     bottom:0;
//     left:0;
//     right:0;
// }

// .panel-inner -widget .widget -content{
//     height:100%;
// }

// .panel-inner -widget .widget -content > .the-form > .wegas-react-form,
// .panel-inner -widget .widget -content > .the-form > .wegas-react-form > .wegas-react-form-content {
//     overflow: visible;
// }

// .panel-inner -widget .widget .find-result{
//     overflow: auto;
// }
})