/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LanguagesProvider } from '../Components/Contexts/LanguagesProvider';
import '../css/global.css';
import Layout from './Components/Layout';
import { LibrariesLoader } from './Components/LibrariesLoader';
import { ClassesProvider } from '../Components/Contexts/ClassesProvider';
import { FeaturesProvider } from '../Components/Contexts/FeaturesProvider';
import { ThemeProvider } from '../Components/Style/Theme';
import '../data/Stores/store';
import { importPageComponents } from '../Components/PageComponents/tools/componentFactory';
import { PopupManager } from '../Components/PopupManager';
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
      <LanguagesProvider>
        <ClassesProvider>
          <LibrariesLoader>
            <ThemeProvider contextName="editor">
              <PopupManager>
                <Layout />
              </PopupManager>
            </ThemeProvider>
          </LibrariesLoader>
        </ClassesProvider>
      </LanguagesProvider>
    </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Components/Layout', () => {
    mount();
  });
}
