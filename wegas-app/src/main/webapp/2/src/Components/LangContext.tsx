import * as React from 'react';
import { Menu } from './Menu';
import { useGameModel } from './Hooks/useGameModel';

interface LangProviderProps {
  lang?: string;
  children?: React.ReactNode;
  availableLang?: IGameModelLanguage[];
}
interface Context extends LangProviderProps {
  lang: string;
  selectLang: (lang: string) => void;
  availableLang: IGameModelLanguage[];
}
export const LangContext = React.createContext<Context>({
  lang: '',
  selectLang: () => {},
  availableLang: [],
});

function LangHandler({
  availableLang,
  lang,
  children,
}: Readonly<LangProviderProps>) {
  const gameModelLanguages = useGameModel().languages;
  const getAvailableLanguages = availableLang
    ? availableLang
    : gameModelLanguages;
  const getCurrentLanguage = lang || getAvailableLanguages[0].code;

  const [currentLang, setCurrentLang] = React.useState(getCurrentLanguage);
  React.useEffect(() => {
    setCurrentLang(currentLanguage => {
      if (
        !getAvailableLanguages
          .map(language => language.code)
          .includes(currentLanguage)
      ) {
        return getCurrentLanguage;
      }
      return currentLanguage;
    });
  }, [getAvailableLanguages, getCurrentLanguage]);

  function selectLang(lang: string) {
    setCurrentLang(lang);
  }
  return (
    <LangContext.Provider
      value={{
        availableLang: availableLang ? availableLang : gameModelLanguages,
        lang: currentLang,
        selectLang,
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

/**
 * Provider for LangContext Handles stores language change
 */
export const LangProvider = React.memo(LangHandler);

/**
 * Language selector allows to select language inside the language context given by the LangProvider
 */
export function LangToggler() {
  const { lang, selectLang: toggleLang, availableLang } = React.useContext(
    LangContext,
  );
  return (
    <Menu
      label={lang}
      items={availableLang.map(language => ({
        id: language.code,
        label: `${language.code} : ${language.lang}`,
      }))}
      onSelect={item => toggleLang(item.id)}
    />
  );
}
