import * as React from 'react';

interface LangProviderProps {
  lang?: string;
  children?: React.ReactNode;
  availableLang: { code: string; label: string; active: boolean }[];
}
interface Context extends LangProviderProps {
  lang: string;
  toggleLang: (lang: string) => void;
}
export const LangContext = React.createContext<Context>({
  lang: 'DEF',
  toggleLang: () => {},
  availableLang: [],
});

function LangHandler({
  availableLang,
  lang,
  children,
}: Readonly<LangProviderProps>) {
  const [currentLang, setCurrentLang] = React.useState(lang || 'DEF');
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
          {`[${l.code}] ${l.label}`}
        </option>
      ))}
    </select>
  );
}
