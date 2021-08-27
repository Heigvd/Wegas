import * as React from 'react';
import ReactSelect from 'react-select';

class GameSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: Array.apply(null, Array(props.groupsCount)).map(() => []),
            oldRef: -1,
        };
    }
    componentWillReceiveProps(props) {
        if (props.games !== this.props.games) {
            this.setState({
                options: props.games.map(val => ({
                    value: val.id,
                    label: val.name
                        ? `${val.name} (${val.gmName}) by ${val.creator} (P: ${val.playersCount})`
                        : val.id,
                    playersCount: val.playersCount
                })),
            });
        }
    }
    onChange(group, value) {
        const val = value.map(v => v.value);
        const { groups } = this.state;
        groups[group] = val;
        this.setState({
            groups,
        });
        if (groups[0][0] && this.state.oldRef !== groups[0][0]) {
            this.setState({
                oldRef: groups[0][0],
            });
            this.props.onRefSelect(groups[0][0]);
        }
        this.props.onChange(groups);
    }
    genGroups(opt) {
        const { groupsCount } = this.props;
        const ret = [];
        const style = {
            display: 'inline-block',
            minWidth: '15em',
        };
        const options = opt ? opt.sort( (a, b) => b.playersCount - a.playersCount ) : undefined;
        for (let groupId = 0; groupId < groupsCount; groupId++) {
            ret.push(
                <span key={groupId} style={style}>
                    <span>{`Group ${groupId + 1}`}</span>
                    <ReactSelect
                        multi
                        onChange={this.onChange.bind(this, groupId)}
                        options={ options }
                        value={this.state.groups[groupId]}
                    />
                </span>
            );
        }
        return ret;
    }

    render() {
        return (
            <div>
                {this.genGroups(this.state.options)}
            </div>
        );
    }
}
GameSelect.defaultProps = {
    games: [1, 2, 3, 4, 5, 6, 7],
    onRefSelect: () => undefined,
    groupsCount: 4,
};
export default GameSelect;
