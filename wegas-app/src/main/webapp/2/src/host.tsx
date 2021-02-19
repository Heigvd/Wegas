/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { ThemeProvider } from './Components/Style/Theme';
// import { ClassesProvider } from './Components/Contexts/ClassesProvider';
// import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
// import { PopupManager } from './Components/PopupManager';
import './css/global.css';
import './data/Stores/store';
// import Layout from './Editor/Components/Layout';
import HostLayout from './Host/HostLayout';
// import { LibrariesLoader } from './Editor/Components/LibrariesLoader';

importPageComponents();

function mount() {
  render(
    // <FeaturesProvider>
    //   <LanguagesProvider>
    //     <ClassesProvider>
    //       <LibrariesLoader>
    //           <PopupManager>
    <LanguagesProvider>
      <ThemeProvider contextName="trainer">
        <HostLayout />
      </ThemeProvider>
    </LanguagesProvider>,
    //           </PopupManager>
    //       </LibrariesLoader>
    //     </ClassesProvider>
    // </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Host/HostLayout', () => {
    mount();
  });
}
