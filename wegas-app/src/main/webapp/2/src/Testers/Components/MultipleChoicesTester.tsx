import * as React from 'react';
import { css } from 'emotion';
import {
  MultipleChoice,
  Choices,
} from '../../Components/Inputs/Choices/MultipleChoice';

export const testerSectionStyle = css({
  borderStyle: 'solid',
  borderColor: 'black',
  margin: '2px',
});

const testChoices = {
  choice1: 'choice1',
  choice2: 'choice2',
  choice3: 'choice3',
  choice4: 'choice4',
};

export default function MultipleChoicesTester() {
  const [chosen, setChosen] = React.useState<Choices<string>>({});

  return (
    <div>
      Simple
      <MultipleChoice
        choices={testChoices}
        value={chosen}
        onChange={setChosen}
      />
      Styled
      <MultipleChoice
        choices={testChoices}
        value={chosen}
        onChange={setChosen}
        className={css({
          backgroundColor: '#009c00',
          margin: '2px',
          ':hover': {
            backgroundColor: 'darkgreen',
          },
        })}
        selectedClassName={css({
          backgroundColor: 'darkgreen',
          ':hover': {
            backgroundColor: 'darkgreen',
          },
        })}
      />
      Disabled
      <MultipleChoice
        choices={testChoices}
        value={chosen}
        onChange={setChosen}
        disabled
      />
      ReadOnly
      <MultipleChoice
        choices={testChoices}
        value={chosen}
        onChange={setChosen}
        readOnly
      />
    </div>
  );
}
