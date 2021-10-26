import * as React from 'react';
import { IGameModelLanguage } from 'wegas-ts-api';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { DropDownDirection } from '../DropDown';
import { DropMenu, SelecteDropdMenuItem } from '../DropMenu';
import { useGameModel } from '../Hooks/useGameModel';
import { CheckBox } from '../Inputs/Boolean/CheckBox';

interface LanguagesProviderProps {
  lang?: string;
  children?: React.ReactNode;
  availableLang?: IGameModelLanguage[];
}
export interface LanguagesContext extends LanguagesProviderProps {
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

interface LanguageSelectorProps extends ClassStyleId {
  language?: string;
  onSelect: (
    item: SelecteDropdMenuItem<IGameModelLanguage>,
    keyEvent: ModifierKeysEvent,
  ) => void;
  filterActiveLanguages?: boolean;
  label?: string;
  direction?: DropDownDirection;
  buttonClassName?: string;
}
export function LanguageSelector({
  language,
  onSelect,
  filterActiveLanguages,
  style,
  className,
  label,
  direction,
  buttonClassName,
}: LanguageSelectorProps) {
  const { lang, availableLang } = React.useContext(languagesCTX);
  const [currentLanguage, setCurrentLang] = React.useState(
    language ? language : lang,
  );
  const languages = filterActiveLanguages
    ? availableLang.filter(language => language.active)
    : availableLang;
  return (
    <DropMenu
      label={`${label && label + ':'} ${currentLanguage}`}
      items={languages.map(language => ({
        value: language,
        label: `${language.code} : ${language.lang}`,
      }))}
      onSelect={(item, keys) => {
        setCurrentLang(item.value.code);
        onSelect(item, keys);
      }}
      style={style}
      buttonClassName={buttonClassName}
      containerClassName={className}
      direction={direction && direction}
    />
  );
}
export function useLangToggler() {
  const i18nValues = useInternalTranslate(commonTranslations);
  const { lang, availableLang, selectLang } = React.useContext(languagesCTX);
  return {
      label: i18nValues.language + ' : ' + lang,
      items: availableLang.map(language => ({
        value: language,
        label: (
          <div
            onClick={e => {
              e.stopPropagation();
              selectLang(language.code);
              }}>
            <CheckBox
              value={language.code === lang}
              onChange={() => {selectLang(language.code);
              }}
              label={language.code + ' : ' + language.lang}
              horizontal
            />
          </div>
        ),
      })),
  };
}
