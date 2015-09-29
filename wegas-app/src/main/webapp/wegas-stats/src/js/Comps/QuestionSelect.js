import React from 'react';
import ReactSelect from 'react-select';

class QuestionSelect extends React.Component {

    render() {
        const snapshot = this.props.snapshot;
        const opt = JSON.search(snapshot, '//*[@class="QuestionDescriptor"]').map((i) => {
            return {
                value: i.name,
                label: JSON.search(snapshot, `//*[name="${i.name}"]/ancestor::*[@class="ListDescriptor"]`)
                        .reduce((pre, cur) => {
                            return `${pre}${cur.label} \u2192 `;
                        }, '') + i.label
            };
        });
        const style = {
            display: 'inline-block',
            minWidth: '60em'
        };
        return (
            <div style={ style }>
              <ReactSelect options={ opt }
                           onChange={ this.props.onQuestionSelect }
                           value={ this.props.value } />
            </div>
            );
    }
}
export default QuestionSelect;
