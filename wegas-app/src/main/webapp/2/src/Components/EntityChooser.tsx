import * as React from 'react';
import { css, cx } from 'emotion';
import { deepDifferent } from './Hooks/storeHookFactory';
import { flex, flexColumn, flexRow, grow, halfOpacity, justifyCenter } from '../css/classes';
import { themeVar } from './Style/ThemeVars';
import { classNameOrEmpty } from '../Helper/className';

const entityChooser = css({
  width: '100%',
});

const labelList = css({
  minWidth: '180px',
  maxWidth: '180px',
  padding: '10px',
});

const labelStyle = cx(
  css({
    backgroundColor: themeVar.Common.colors.PrimaryColor,
    padding: '10px',
    boxShadow: `2px 2px 6px rgba(0, 0, 0, 0.2)`,
    color: themeVar.Common.colors.LightTextColor,
    borderRadius: themeVar.Common.dimensions.BorderRadius,
    border: "2px solid transparent",
    '&:hover': {
      backgroundColor: themeVar.Common.colors.ActiveColor,
      cursor: 'pointer',
    },
  }),
  grow,
);
/* const labelArrow = css({
  borderTop: '20px solid transparent',
  borderBottom: '20px solid transparent',
  borderLeft: `20px solid ${themeVar.Common.colors.HeaderColor}`,
}); */

const labelContainer = css({
  marginBottom: '10px',
  /* [`&>.${labelArrow}`]: {
      borderLeft: `20px solid ${themeVar.Common.colors.DisabledColor}`,
    }, */
});

const activeLabel = css(
  {
    backgroundColor: themeVar.Common.colors.ActiveColor,
    color: themeVar.Common.colors.LightTextColor,
    boxShadow: "none",
    border: "2px solid " + themeVar.Common.colors.ActiveColor,
  },
  /*
    borderLeft: `20px solid ${themeVar.Common.colors.PrimaryColor}`,
 */
  /*
      borderLeft: `20px solid ${themeVar.Common.colors.ActiveColor}`,
  */
);

const entityContainer = css({
  padding: '10px',
  width: '80%',
});

interface EntityChooserProps<E extends IAbstractEntity> {
  entities: E[];
  children: React.FunctionComponent<{ entity: E }>;
  entityLabel: (entity: E) => React.ReactNode;
  customLabelStyle?: (entity: E) => string | undefined;
  autoOpenFirst?: boolean;
  /**
   * disabled - if true, displayed as disabled
   */
  disabled?: boolean;
}

export function EntityChooser<E extends IAbstractEntity>({
  entities,
  children: Children,
  entityLabel,
  customLabelStyle,
  autoOpenFirst,
  disabled,
}: EntityChooserProps<E>) {
  const [entity, setEntity] = React.useState<E>();

  React.useEffect(() => {
    setEntity(oldEntity => {
      if (
        autoOpenFirst &&
        (oldEntity == null || !entities.map(e => e.id).includes(oldEntity.id))
      ) {
        return entities[0];
      } else {
        return oldEntity;
      }
    });
  }, [autoOpenFirst, entities]);

  return (
    <div className={cx(flex, flexRow, entityChooser, {[halfOpacity]: disabled})}>
      <div className={cx(flex, flexColumn, labelList)}>
        {entities.map(e => (
          <div
            key={e.id}
            className={cx(
              flex,
              flexRow,
              labelContainer,
            )}
            onClick={() => {
              setEntity(oldEntity => {
                if (deepDifferent(e, oldEntity)) {
                  return e;
                } else {
                  return oldEntity;
                }
              });
            }}
          >
            <div
              className={cx(
                labelStyle,
                classNameOrEmpty(customLabelStyle && customLabelStyle(e)),
                {
                  [activeLabel]: entity?.id === e.id,
                },
              )}
            >
              {entityLabel(e)}
            </div>
            {/* <div className={labelArrow} /> */}
          </div>
        ))}
      </div>
      {entity != null && (
        <div className={cx(flex, entityContainer, grow, justifyCenter)}>
          {<Children entity={entity} />}
        </div>
      )}
    </div>
  );
}
