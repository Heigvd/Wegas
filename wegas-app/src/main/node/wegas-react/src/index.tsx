/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { RoleProvider } from './Components/Contexts/RoleProvider';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { PopupManager } from './Components/PopupManager';
import { ThemeProvider } from './Components/Theme/Theme';
import './css/global.css';
import './data/Stores/store';
import Layout from './Editor/Components/Layout';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { FullscreenProvider } from './Editor/Components/LinearTabLayout/DnDTabLayout';
// import * as less from 'less';
// import { wlog } from '../Helper/wegaslog';

importPageComponents();

// function TestLessLib() {
//   const lesstest = less
//     .render(
//       `.wegas {
//       @MainColor: blue;
//       @DisabledColor: grey;
//       @TextColor: white;

//       &.wegas-btn {
//         background-color: @MainColor;
//         color: @TextColor;
//         border-style: none;
//         padding-left: 5px;
//         padding-right: 5px;
//         padding-top: 2px;
//         padding-bottom: 2px;
//         cursor: pointer;
//         &.disabled {
//           background-color: @DisabledColor;
//           cursor: initial;
//         }
//       }
//     }`,
//     )
//     .then(output => output.css)
//     .catch(error => {
//       wlog(error);
//       return '';
//     });

//   wlog(lesstest);
//   return null;
// }

function mount() {
  render(
    <FeaturesProvider>
      <FullscreenProvider>
        <LanguagesProvider>
          <ClassesProvider>
            <LibrariesLoader>
              <RoleProvider>
                <ThemeProvider contextName="editor">
                  <PopupManager>
                    <Layout />
                  </PopupManager>
                </ThemeProvider>
              </RoleProvider>
            </LibrariesLoader>
          </ClassesProvider>
        </LanguagesProvider>
      </FullscreenProvider>
    </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Editor/Components/Layout', () => {
    mount();
  });
}