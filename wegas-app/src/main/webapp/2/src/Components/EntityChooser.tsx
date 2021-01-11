import * as React from 'react';
import { css, cx } from 'emotion';
import { deepDifferent } from './Hooks/storeHookFactory';
import { flex, flexColumn, flexRow, grow, justifyCenter } from '../css/classes';
import { themeVar } from './Style/ThemeVars';

const entityChooser = css({
  width: '100%',
});

const labelList = css({
  maxWidth: '40%',
  minWidth: '20%',
  padding: '10px',
});

const labelStyle = cx(
  css({
    backgroundColor: themeVar.Common.colors.HeaderColor,
    padding: '10px',
    display: 'flex',
  }),
  grow,
);

const labelArrow = css({
  borderTop: '40px solid transparent',
  borderBottom: '40px solid transparent',
  borderLeft: `20px solid ${themeVar.Common.colors.HeaderColor}`,
});

const labelContainer = css({
  marginBottom: '10px',
  ':hover': {
    [`&>.${labelStyle}`]: {
      cursor: 'pointer',
      backgroundColor: themeVar.Common.colors.HoverColor,
    },
    [`&>.${labelArrow}`]: {
      cursor: 'pointer',
      borderLeft: `20px solid ${themeVar.Common.colors.HoverColor}`,
    },
  },
});

const activeLabel = css({
  [`&>.${labelStyle}`]: {
    backgroundColor: themeVar.Common.colors.MainColor,
  },
  [`&>.${labelArrow}`]: {
    borderLeft: `20px solid ${themeVar.Common.colors.MainColor}`,
  },
  ':hover': {
    // ideally have an active and hover color
    [`&>.${labelStyle}`]: {
      cursor: 'pointer',
      backgroundColor: themeVar.Common.colors.ActiveColor,
    },
    [`&>.${labelArrow}`]: {
      cursor: 'pointer',
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
  autoOpenFirst?: boolean;
}

export function EntityChooser<E extends IAbstractEntity>({
  entities,
  children: Children,
  entityLabel,
  autoOpenFirst,
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
                  return oldEntity;
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
