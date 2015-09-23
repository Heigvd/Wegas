import React from 'react';
import ReactSelect from 'react-select';

class GameSelect extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            groups: Array.apply(null, Array(props.groups_count)).map(() => []),
            oldRef: -1
        };
    }
    componentWillReceiveProps(props) {
        this.setState({
            options: props.games.map(v => {
                return {
                    value: v.id,
                    label: v.name ? `${v.name} (${v.gmName})` : v.id
                };
            })
        });
    }
    onChange(group, value) {
        const v = value ? value.split(',') : [];
        const {groups} = this.state;
        groups[group] = v;
        this.setState({
            groups
        });
        if (groups[0][0] && this.state.oldRef !== groups[0][0]) {
            this.setState({
                oldRef: groups[0][0]
            });
            this.props.onRefSelect(groups[0][0]);
        }
        this.props.onChange(groups);
    }
    genGroups(opt) {
        const {groups_count} = this.props;
        const ret = [];
        const style = {
            display: 'inline-block',
            minWidth: '15em'
        };
        for (let i = 0; i < groups_count; i++) {
            ret.push(<span key={ i }
                           style={ style }><span>{ `Group ${i + 1}` }</span>
                     <ReactSelect multi={ true }
                                  onChange={ this.onChange.bind(this, i) }
                                  options={ opt }
                                  value={ this.state.groups[i] && this.state.groups[i].join(',') } />
                     </span>);
        }
        return ret;
    }

    render() {

        return (
            <div>
              { this.genGroups(this.state.options) }
            </div>
            );
    }
}
GameSelect.defaultProps = {
    games: [
        1, 2, 3, 4, 5, 6, 7
    ],
    onRefSelect: () => undefined,
    groups_count: 4
};
export default GameSelect;
