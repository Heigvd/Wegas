import * as React from "react";
import { LangConsumer } from "../LangContext";
import { Schema } from "jsoninput";
import { infoStyle } from "./commonView";
import { css } from "glamor";
import IconButton from "../Components/IconButton";

interface Translation {
  translation: string;
  status: string;
}

interface TranslatableProps {
  value: {
    [code: string]: Translation;
  };
  onChange: (value: { [code: string]: Translation }) => void;
  view: Schema["view"] & {
    label?: string;
    readOnly: boolean;
  };
}

interface EndProps {
  value?: string | number;
  onChange: (value: string) => void;
  view: {};
}
/**
 * HOC: Transform a hashmap (lang:value) into value based on current language
 * @param Comp
 */
export default function translatable<P extends EndProps>(
  Comp: React.ComponentType<P>
): React.SFC<TranslatableProps & P> {
  function Translated(props: TranslatableProps) {
    if (!props.value) {
      return null;
    }

    function catchUp(code: string) {
      const value = props.value[code] ? props.value[code].translation : "";
      const newValue = {
        ...props.value,
        [code]: {
          translation: value,
          status: ""
        }
      };

      props.onChange(newValue);
    }
    function outdate(code: string) {
      const value = props.value[code] ? props.value[code].translation : "";
      const newValue = {
        ...props.value,
        [code]: {
          translation: value,
          status: "outdated:manual"
        }
      };
      props.onChange(newValue);
    }

    function markAsMajor(
      code: string,
      allLanguages: { code: string; label: string }[]
    ) {
      let newValue = {};
      for (let lang of allLanguages) {
        newValue[lang.code] = {
          translation: props.value[lang.code]
            ? props.value[lang.code].translation
            : "",
          status: "outdated:" + code
        };
      }

      newValue[code].status = "";
      props.onChange(newValue);
    }

    return (
      <LangConsumer>
        {({ lang, availableLang }) => {
          // Updade label
          const curCode = (
            availableLang.find(
              l => l.code.toUpperCase() === lang.toUpperCase()
            ) || {
              code: ""
            }
          ).code;

          let translation;
          let status;

          if (props.value.hasOwnProperty(lang.toUpperCase())) {
            translation = props.value[lang.toUpperCase()].translation;
            status = props.value[lang.toUpperCase()].status;
          } else if (props.value.hasOwnProperty(lang.toLowerCase())) {
            translation = props.value[lang.toLowerCase()].translation;
            status = props.value[lang.toLowerCase()].status;
          }

          const view = {
            ...props.view,
            label: (
              <span>
                {(props.view || { label: "" }).label}{" "}
                <span className={String(infoStyle)}>
                  [{curCode.toLowerCase()}] {status ? "(" + status + ")" : ""}
                </span>
              </span>
            )
          };
          if (view.readOnly) {
            // variable is protected by the model
            const theLanguage = availableLang.find(al => al.code === lang);
            if (theLanguage != null && theLanguage.visibility === "PRIVATE") {
              // but this language is not defined by the model
              if (
                Object.entries(props.value).find(([key, value]) => {
                  const lang = availableLang.find(al => al.code === key);
                  return lang && lang.visibility != "PRIVATE" && value.translation;
                })
              ) {
                view.readOnly = false;
              }
            }
          }

          const editor = (
            // @ts-ignore https://github.com/Microsoft/TypeScript/issues/28748
            <Comp
              {...props}
              value={translation}
              view={view}
              onChange={value => {
                const status = props.value[lang]
                  ? props.value[lang].status
                  : "";
                const v = {
                  ...props.value,
                  [lang]: {
                    translation: value,
                    status: status
                  }
                };
                props.onChange(v);
              }}
            />
          );
          //return editor;

          const readOnly = view.readOnly;
          const orangeStyle = css({
            color: "#F57C00"
          });

          const greenStyle = css({
            color: "#388E3C"
          });

          const majorButton = !readOnly ? (
            <IconButton
              icon={[
                `fa fa-toggle-on fa-stack-1x ${orangeStyle}`,
                `fa fa-expand fa-stack-1x ${css({
                  transform: "translate(0, 8px) rotate(45deg)"
                })}`
              ]}
              className={`wegas-advanced-feature ${css({
                lineHeight: "1.2em"
              })}`}
              tooltip="Major update"
              onClick={() => {
                markAsMajor(curCode, availableLang);
              }}
            />
          ) : (
            ""
          );

          const outdateButton = !readOnly ? (
            <IconButton
              className="wegas-advanced-feature"
              icon={[`fa fa-toggle-on ${greenStyle}`]}
              tooltip="Mark as outdated "
              onClick={() => {
                outdate(curCode);
              }}
            />
          ) : (
            ""
          );

          if (!props.value[curCode] || !props.value[curCode].status) {
            return (
              <span>
                {editor}
                {majorButton}
                {outdateButton}
              </span>
            );
          } else {
            return (
              <span>
                {editor}
                {majorButton}
                {!readOnly ? (
                  <IconButton
                    icon={[`fa fa-toggle-on fa-flip-horizontal ${orangeStyle}`]}
                    className="wegas-advanced-feature"
                    tooltip="Mark as up-to-date"
                    onClick={() => {
                      catchUp(curCode);
                    }}
                  />
                ) : (
                  ""
                )}
              </span>
            );
          }
        }}
      </LangConsumer>
    );
  }
  return Translated;
}
