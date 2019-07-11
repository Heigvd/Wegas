import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import Editor from './EntityEditor';
import { TabLayout } from '../../Components/Tabs';
import { ImperativeModals, globalModals, WModals } from './ImperativeModals';

const layout = css({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  height: '100%',
  gridTemplateColumns: 'auto 1fr auto',
  '& > div': {
    boxSizing: 'border-box',
    borderRight: '1px solid',
  },
});

const fullWidth = css({ gridColumnEnd: 'span 3' });

export default class AppLayout extends React.Component<
  {},
  { editable: boolean }
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      editable: false,
    };
  }
  render() {
    return (
      <ImperativeModals global={true}>
        {(modals: WModals) => {
          return (
            <div className={layout}>
              <div className={fullWidth}>
                <Header />
              </div>
              <div>
                <TabLayout tabs={['TestModalLocal', 'TestModalGlobal']}>
                  {[modals, globalModals].map((m, i) => {
                    return (
                      <div key={i}>
                        <button
                          onClick={() => m.walert('This is a test alert')}
                        >
                          Test alert
                        </button>
                        <button
                          onClick={() =>
                            m.waccept('This is a test accept', res => {
                              console.log('accept answered : ' + res);
                            })
                          }
                        >
                          Test accept
                        </button>
                        <button
                          onClick={() =>
                            m.wprompt('This is a test prompt', res => {
                              console.log('prompt answered : ' + res);
                            })
                          }
                        >
                          Test prompt
                        </button>
                        <button
                          onClick={() => {
                            for (let i = 0; i < 10; i += 1) {
                              m.walert('This is a multi test alert');
                            }
                          }}
                        >
                          Test Multiple Modals
                        </button>
                        <button
                          onClick={() =>
                            m.walert(
                              <>
                                <div>Super!!!</div>
                                <input type={'text'} />
                                <img
                                  src={
                                    'https://www.google.com//images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
                                  }
                                />
                              </>,
                            )
                          }
                        >
                          Test custom content
                        </button>
                      </div>
                    );
                  })}
                </TabLayout>
              </div>
              <div>
                <Editor />
              </div>
            </div>
          );
        }}
      </ImperativeModals>
    );
  }
}
