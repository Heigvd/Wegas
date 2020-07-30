import * as React from 'react';
import { Menu } from '../Menu';
import { useGameModel } from '../Hooks/useGameModel';
import { IGameModelLanguage } from 'wegas-ts-api';

interface LanguagesProviderProps {
  lang?: string;
  children?: React.ReactNode;
  availableLang?: IGameModelLanguage[];
}
interface LanguagesContext extends LanguagesProviderProps {
  lang: string;
  selectLang: (lang: string) => void;
  availableLang: IGameModelLanguage[];
}

export const languagesCTX = React.createContext<LanguagesContext>({
  lang: '',
  selectLang: () => {},
  availableLang: [],
});

function LanguagesContext({
  availableLang,
  lang,
  children,
}: Readonly<LanguagesProviderProps>) {
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
    if (gameModelLanguages.find(l => l.code === lang)) {
      setCurrentLang(lang);
    }
  }
  return (
    <languagesCTX.Provider
      value={{
        availableLang: availableLang ? availableLang : gameModelLanguages,
        lang: currentLang,
        selectLang,
      }}
    >
      {children}
    </languagesCTX.Provider>
  );
}

/**
 * Provider for LangContext Handles stores language change
 */
export const LanguagesProvider = React.memo(LanguagesContext);

/**
 * Language selector allows to select language inside the language context given by the LangProvider
 */
export function LangToggler() {
  const { lang, selectLang, availableLang } = React.useContext(languagesCTX);
  return (
    <Menu
      label={lang}
      items={availableLang.map(language => ({
        value: language.code,
        label: `${language.code} : ${language.lang}`,
      }))}
      onSelect={({ value }) => selectLang(value)}
    />
  );
}
