import * as React from 'react';
import { css } from 'emotion';
import { MultipleChoice } from '../Components/Inputs/Choices/MultipleChoice';

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
  const [chosen, setChosen] = React.useState();

  return (
    <div>
      Simple
      <MultipleChoice
        choices={testChoices}
        chosen={chosen}
        onChange={setChosen}
      />
      Styled
      <MultipleChoice
        choices={testChoices}
        chosen={chosen}
        onChange={setChosen}
        choiceClassName={css({
          backgroundColor: '#009c00',
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
        chosen={chosen}
        onChange={setChosen}
        disabled
      />
      ReadOnly
      <MultipleChoice
        choices={testChoices}
        chosen={chosen}
        onChange={setChosen}
        readOnly
      />
    </div>
  );
}
