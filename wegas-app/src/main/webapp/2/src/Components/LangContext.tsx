import * as React from 'react';

interface Context {
  lang: string;
  toggleLang: (lang: string) => void;
  availableLang: { refName: string; code: string; label: string }[];
}
const LangContext = React.createContext<Context>({
  lang: 'DEF',
  toggleLang: () => {},
  availableLang: [],
});
export const LangConsumer = LangContext.Consumer;

interface LangProviderProps {
  lang: string;
  availableLang: { refName: string; code: string; label: string }[];
}
export class LangHandler extends React.Component<LangProviderProps, Context> {
  static getDerivedStateFromProps(props: LangProviderProps, state: Context) {
    if (props.availableLang !== state.availableLang) {
      return { availableLang: props.availableLang };
    }
    return null;
  }

  toggleLang = (lang: string) => {
    this.setState(() => ({ lang }));
  };
  readonly state: Readonly<Context> = {
    lang: this.props.lang,
    toggleLang: this.toggleLang,
    availableLang: this.props.availableLang,
  };

  render() {
    return (
      <LangContext.Provider value={this.state}>
        {this.props.children}
      </LangContext.Provider>
    );
  }
}

export function LangToggler() {
  return (
    <LangContext.Consumer>
      {({ lang, toggleLang, availableLang }) => (
        <select value={lang} onChange={ev => toggleLang(ev.target.value)}>
          {availableLang.map(l => (
            <option key={l.refName} value={l.refName}>
              {`[${l.code}] ${l.label}`}
            </option>
          ))}
        </select>
      )}
    </LangContext.Consumer>
  );
}
