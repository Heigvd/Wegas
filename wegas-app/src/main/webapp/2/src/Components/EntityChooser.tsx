import * as React from 'react';
import { css, cx } from 'emotion';
import { deepDifferent } from './Hooks/storeHookFactory';
import { flex, flexColumn, flexRow, grow, justifyCenter } from '../css/classes';
import { themeVar } from './Style/ThemeVars';

const entityChooser = css({
  width: '100%',
});

const labelList = css({
  maxWidth: '20%',
  minWidth: '20%',
  padding: '10px',
});

const labelStyle = cx(
  css({
    backgroundColor: themeVar.Common.colors.HeaderColor,
    padding: '10px',
    boxShadow: `-2px 2px 2px ${themeVar.Common.colors.HeaderColor}`,
  }),
  grow,
);

const labelArrow = css({
  borderTop: '20px solid transparent',
  borderBottom: '20px solid transparent',
  borderLeft: `20px solid ${themeVar.Common.colors.HeaderColor}`,
});

const labelContainer = css({
  marginBottom: '10px',
  ':hover': {
    [`&>.${labelStyle}`]: {
      backgroundColor: themeVar.Common.colors.DisabledColor,
    },
    [`&>.${labelArrow}`]: {
      borderLeft: `20px solid ${themeVar.Common.colors.DisabledColor}`,
    },
  },
});

const activeLabel = css({
  [`&>.${labelStyle}`]: {
    backgroundColor: themeVar.Common.colors.PrimaryColor,
  },
  [`&>.${labelArrow}`]: {
    borderLeft: `20px solid ${themeVar.Common.colors.PrimaryColor}`,
  },
  ':hover': {
    [`&>.${labelStyle}`]: {
      backgroundColor: themeVar.Common.colors.ActiveColor,
    },
    [`&>.${labelArrow}`]: {
      borderLeft: `20px solid ${themeVar.Common.colors.ActiveColor}`,
    },
  },
});

const entityContainer = css({
  padding: '10px',
  width: '80%',
});

interface EntityChooserProps<E extends IAbstractEntity> {
  entities: E[];
  children: React.FunctionComponent<{ entity: E }>;
  entityLabel: (entity: E) => React.ReactNode;
}

export function EntityChooser<E extends IAbstractEntity>({
  entities,
  children: Children,
  entityLabel,
}: EntityChooserProps<E>) {
  const [entity, setEntity] = React.useState<E>();

  return (
    <div className={cx(flex, flexRow, entityChooser)}>
      <div className={cx(flex, flexColumn, labelList)}>
        {entities.map(e => (
          <div
            key={e.id}
            className={cx(flex, flexRow, labelContainer, {
              [activeLabel]: entity?.id === e.id,
            })}
            onClick={() => {
              setEntity(oldEntity => {
                if (deepDifferent(e, oldEntity)) {
                  return e;
                } else {
                  return undefined;
                }
              });
            }}
          >
            <div className={labelStyle}>{entityLabel(e)}</div>
            <div className={labelArrow} />
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
