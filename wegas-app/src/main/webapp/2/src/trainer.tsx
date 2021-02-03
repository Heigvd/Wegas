/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { ThemeProvider } from './Components/Style/Theme';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { PageLoader } from './Editor/Components/Page/PageLoader';
import { css } from 'emotion';
import { visitIndex } from './Helper/pages';
import { State } from './data/Reducer/reducers';
import { useStore } from './data/Stores/store';
import { DndLinearLayout } from './Editor/Components/LinearTabLayout/LinearLayout';
import { ComponentMap } from './Editor/Components/LinearTabLayout/DnDTabLayout';
import { wlog } from './Helper/wegaslog';
import { getAll } from './data/Reducer/pageState';

importPageComponents();

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

export const trainerLayoutId = 'TrainerLayout';

function trainerPagesSelector(s: State) {
  wlog(s.pages);
  // debugger;
  return s.pages.index
    ? visitIndex(s.pages.index.root, item => item).filter(
        item => item.trainerPage,
      )
    : [];
}

export default function TrainerLayout() {
  React.useEffect(() => {
    debugger;
    getAll();
  });

  const trainerPages: ComponentMap = useStore(trainerPagesSelector).reduce(
    (o, i) => ({ ...o, [i.name]: <PageLoader selectedPageId={i.id} /> }),
    {},
  );

  return (
    <div id="WegasLayout" className={layout}>
      <DndLinearLayout
        tabs={trainerPages}
        initialLayout={[Object.keys(trainerPages)[0]]}
        layoutId={trainerLayoutId}
      />
    </div>
  );
}

function mount() {
  render(
    <FeaturesProvider>
      <LanguagesProvider>
        <ClassesProvider>
          <LibrariesLoader>
            <ThemeProvider contextName="player">
              <TrainerLayout />
            </ThemeProvider>
          </LibrariesLoader>
        </ClassesProvider>
      </LanguagesProvider>
    </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();
