import * as React from 'react';

interface LangProviderProps {
  lang?: string;
  children?: React.ReactNode;
  availableLang: IGameModelLanguage[];
}
interface Context extends LangProviderProps {
  lang: string;
  toggleLang: (lang: string) => void;
}
export const LangContext = React.createContext<Context>({
  lang: '',
  toggleLang: () => {},
  availableLang: [],
});

function LangHandler({
  availableLang,
  lang,
  children,
}: Readonly<LangProviderProps>) {
  const [currentLang, setCurrentLang] = React.useState(lang || availableLang[0].code);
  function toggleLang(lang: string) {
    setCurrentLang(lang);
  }
  return (
    <LangContext.Provider
      value={{ availableLang, lang: currentLang, toggleLang }}
    >
      {children}
    </LangContext.Provider>
  );
}
/**
 * Provider for LangContext Handles stores language change
 */
export const LangProvider = React.memo(LangHandler);

export function LangToggler() {
  const { lang, toggleLang, availableLang } = React.useContext(LangContext);
  return (
    <select value={lang} onChange={ev => toggleLang(ev.target.value)}>
      {availableLang.map(l => (
        <option key={l.code} value={l.code}>
          {`[${l.code}] ${l.lang}`}
        </option>
      ))}
    </select>
  );
}
