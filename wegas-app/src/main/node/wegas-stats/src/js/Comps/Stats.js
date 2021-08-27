import * as React from 'react';
import { connect } from 'react-redux';
import { selectLogId } from '../Actions/logIdsActions';
import { showOverlay, hideOverlay } from '../Actions/glabal';
import GameSelect from './GameSelect';
import QuestionSelect from './QuestionSelect';
import { fetchVariables } from '../Actions/gamesActions';
import Graph from './Graph';

// @connect(state => ({
//     games: state.games
// }))
class Stats extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentQuestion: null,
            groups: [],
        };
    }
    componentWillMount() {
        this.props.dispatch(selectLogId(this.props.match.params.LogId));
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.match.params.LogId !== nextProps.match.params.LogId) {
            this.props.dispatch(selectLogId(nextProps.match.params.LogId));
        }
    }
    onRefSelect(data) {
        this.props.dispatch(fetchVariables(data));
    }
    onQuestionSelect(question) {
        this.setState({
            currentQuestion: question,
        });
    }

    onGamesChange(curr) {
        //    curr = curr.filter(g => g && g[0] ? g : false);
        this.setState({
            groups: curr,
        });
    }
    genAll() {
        this.props.dispatch(showOverlay());
        this.refs.graph
            .genAll()
            .catch(err => {
                alert(err);
            })
            .then(() => {
                this.props.dispatch(hideOverlay());
            });
    }
    render() {
        const { groups, currentQuestion } = this.state;
        return (
            <div>
                <h2>
                    {this.props.match.params.LogId}
                </h2>
                <GameSelect
                    games={this.props.games}
                    onChange={this.onGamesChange.bind(this)}
                    onRefSelect={this.onRefSelect.bind(this)}
                />
                <QuestionSelect
                    onQuestionSelect={this.onQuestionSelect.bind(this)}
                    snapshot={this.props.snapshot}
                    value={this.state.currentQuestion}
                />
                <button onClick={this.genAll.bind(this)}>Generate all</button>
                <Graph
                    groups={groups}
                    logId={this.props.match.params.LogId}
                    questionName={currentQuestion}
                    ref="graph"
                    snapshot={this.props.snapshot}
                />
            </div>
        );
    }
}
export default connect(state => ({
    games: state.games.available,
    snapshot: state.variables.snapshot,
}))(Stats);
