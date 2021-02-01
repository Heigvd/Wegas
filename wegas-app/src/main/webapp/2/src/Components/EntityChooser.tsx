import * as React from 'react';
import { css, cx } from 'emotion';
import { deepDifferent } from './Hooks/storeHookFactory';
import { flex, flexColumn, flexRow, grow, justifyCenter } from '../css/classes';
import { themeVar } from './Style/ThemeVars';

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
  ':hover': {
    [`&>.${labelStyle}`]: {
      backgroundColor: themeVar.Common.colors.ActiveColor,
      cursor: 'pointer',
    },
    /* [`&>.${labelArrow}`]: {
      borderLeft: `20px solid ${themeVar.Common.colors.DisabledColor}`,
    }, */
  },
});

const activeLabel = css({
  [`&>.${labelStyle}`]: {
    backgroundColor: themeVar.Common.colors.ActiveColor,
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.4)',
  },
  /* [`&>.${labelArrow}`]: {
    borderLeft: `20px solid ${themeVar.Common.colors.PrimaryColor}`,
  }, */
  ':hover': {
    // ideally have an active and hover color
    [`&>.${labelStyle}`]: {
      backgroundColor: themeVar.Common.colors.PrimaryColor,
    },
    /*  [`&>.${labelArrow}`]: {
      borderLeft: `20px solid ${themeVar.Common.colors.ActiveColor}`,
    }, */
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
