import * as React from 'react';
import {selectLogId} from '../Actions/logIdsActions';
import GameSelect, {GameOption} from './GameSelect';
import QuestionSelect from './QuestionSelect';
import {fetchVariables} from '../Actions/gamesActions';
import Graph from './Graph';
import {shallowEqual, useAppDispatch, useAppSelector} from '../Store/hooks';

interface StatsProps {
  match: {
    params: {
      LogId: string;
    };
  };
}

export default function Stats({match}: StatsProps) {
  const dispatch = useAppDispatch();
  const logId = match.params.LogId;

  const [currentQuestion, setCurrentQuestion] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<GameOption[][]>([]);

  const games = useAppSelector(state => {
    return state.games.games;
  }, shallowEqual);

  React.useEffect(() => {
    dispatch(selectLogId(logId));
  }, [logId, dispatch]);

  const onRefSelect = React.useCallback((gameId: number) => {
    dispatch(fetchVariables(gameId));
  }, [dispatch]);

  //  const genAll = React.useCallback(() => {
  //    dispatch(showOverlay());
  //    this.refs.graph
  //      .genAll()
  //      .catch(err => {
  //        alert(err);
  //      })
  //      .then(() => {
  //        dispatch(hideOverlay());
  //      });
  //  }, []);

  return (
    <div>
      <h2>
        {logId}
      </h2>
      <GameSelect
        games={games}
        onChange={setGroups}
        onRefSelect={onRefSelect}
      />
      <QuestionSelect
        onSelect={setCurrentQuestion}
        value={currentQuestion}
      />
      {/*<button onClick={genAll}>Generate all</button>*/}
      <Graph
        groups={groups}
        logId={logId}
        questionName={currentQuestion}
      />
    </div>
  );
}
