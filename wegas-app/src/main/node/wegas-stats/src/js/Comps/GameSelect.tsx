import * as React from "react";
import ReactSelect from "react-select";
import {GameAdmin} from "../API/wegas";

//interface Game {
//}

interface Props {
  groupsCount?: number;
  games: GameAdmin[];
  onChange: (groups: GameOption[][]) => void;
  onRefSelect: (gameId: number) => void;
}

export interface GameOption {
  value: number;
  label: string;
  playersCount: number;
}

interface State {
  groups: GameOption[][];
  oldRef: number;
  options: GameOption[];
}

export default function GameSelect({
  games,
  onChange,
  onRefSelect,
  groupsCount = 4,
}: Props) {
  const [state, setState] = React.useState<State>({
    groups: Array.apply(null, Array(groupsCount)).map(() => []),
    oldRef: -1,
    options: [],
  });

  React.useEffect(() => {
    setState({
      ...state,
      options: games.map((val) => ({
        value: val.gameId!,
        label: val.gameName
          ? `${val.gameName} (${val.gameModelName}) by ${val.creator} (P: ${val.teamCount})`
          : `#${val.id}`,
        playersCount: val.teamCount!,
      })),
    });
  }, [games]);

  const onChangeCb = React.useCallback(
    (group: number, value: Readonly<GameOption[]>) => {
      const { groups } = state;
      groups[group] = [...value];
      setState((state) => ({ ...state, groups }));
      if (groups[0][0].value != null && state.oldRef !== groups[0][0].value) {
        setState((s) => ({
          ...s,
          oldRef: groups[0][0].value,
        }));
        onRefSelect(groups[0][0].value);
      }
      onChange(groups);
    },
    []
  );

  const genGroups = (opt: GameOption[]) => {
    const ret = [];
    const style = {
      display: "inline-block",
      minWidth: "15em",
    };
    const options = opt
      ? opt.sort((a, b) => b.playersCount - a.playersCount)
      : undefined;
    for (let groupId = 0; groupId < groupsCount; groupId++) {
      ret.push(
        <span key={groupId} style={style}>
          <span>{`Group ${groupId + 1}`}</span>
          <ReactSelect
            isMulti
            onChange={(value) => {
              onChangeCb(groupId, value);
            }}
            options={options}
            value={state.groups[groupId]}
          />
        </span>
      );
    }
    return ret;
  };

  return <div>{genGroups(state.options)}</div>;
}
