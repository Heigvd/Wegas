import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  flex,
  flexColumn,
  flexRow,
  grow,
  halfOpacity,
  justifyCenter,
} from '../css/classes';
import { deepDifferent } from './Hooks/storeHookFactory';
import { themeVar } from './Theme/ThemeVars';

const entityChooser = css({
  width: '100%',
});

const labelList = css({
  minWidth: '180px',
  maxWidth: '180px',
  padding: '10px',
});

export const entityChooserLabelStyle = (disabled?: boolean) =>
  cx(
    css({
      backgroundColor: themeVar.colors.PrimaryColor,
      padding: '10px',
      boxShadow: `2px 2px 6px rgba(0, 0, 0, 0.2)`,
      color: themeVar.colors.LightTextColor,
      borderRadius: themeVar.dimensions.BorderRadius,
      border: '2px solid transparent',
      ...(!disabled
        ? {
            '&:hover': {
              backgroundColor: themeVar.colors.ActiveColor,
              cursor: 'pointer',
            },
          }
        : {}),
    }),
    grow,
  );
/* const labelArrow = css({
  borderTop: '20px solid transparent',
  borderBottom: '20px solid transparent',
  borderLeft: `20px solid ${themeVar.colors.HeaderColor}`,
}); */

export const entityChooserLabelContainer = css({
  marginBottom: '10px',
  /* [`&>.${labelArrow}`]: {
      borderLeft: `20px solid ${themeVar.colors.DisabledColor}`,
    }, */
});

export const activeEntityChooserLabel = css(
  {
    backgroundColor: themeVar.colors.ActiveColor,
    color: themeVar.colors.LightTextColor,
    boxShadow: 'none',
    border: '2px solid ' + themeVar.colors.ActiveColor,
  },
  /*
    borderLeft: `20px solid ${themeVar.colors.PrimaryColor}`,
 */
  /*
      borderLeft: `20px solid ${themeVar.colors.ActiveColor}`,
  */
);

const entityContainer = css({
  padding: '10px',
  width: '80%',
});

type childrenType<E> = { entity: E } & DisabledReadonly;

interface EntityChooserProps<E extends IAbstractEntity>
  extends DisabledReadonly {
  entities: E[];
  children: (props: childrenType<E>) => React.ReactNode;//React.FunctionComponent<{ entity: E } & DisabledReadonly> ;
  // entityLabel: (entity: E) => React.ReactNode;
  EntityLabel: React.FunctionComponent<EntityChooserLabelProps<E>>;
  // customLabelStyle?: (entity: E) => string | undefined;
  autoOpenFirst?: boolean;
  addComponent?: React.ReactNode;
}

export function EntityChooser<E extends IAbstractEntity>({
  entities,
  children,
  EntityLabel,
  // customLabelStyle,
  autoOpenFirst,
  disabled,
  readOnly,
  addComponent,
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
    <div
      className={cx(flex, flexRow, entityChooser, {
        [halfOpacity]: disabled,
      })}
    >
      <div className={cx(flex, flexColumn, labelList)}>
        {entities.map(
          e => (
            <EntityLabel
              key={e.id}
              entity={e}
              selected={e.id === entity?.id}
              onClick={() =>
                setEntity(oldEntity => {
                  if (deepDifferent(e, oldEntity)) {
                    return e;
                  } else {
                    return oldEntity;
                  }
                })
              }
            />
          ),
          // (
          //   <div
          //     key={e.id}
          //     className={cx(flex, flexRow, labelContainer)}
          //     onClick={() => {
          //       if (!disabled) {
          //         setEntity(oldEntity => {
          //           if (deepDifferent(e, oldEntity)) {
          //             return e;
          //           } else {
          //             return oldEntity;
          //           }
          //         });
          //       }
          //     }}
          //   >
          //     <div
          //       className={cx(
          //         labelStyle(disabled),
          //         classNameOrEmpty(customLabelStyle && customLabelStyle(e)),
          //         {
          //           [activeLabel]: entity?.id === e.id,
          //         },
          //       )}
          //     >
          //       {entityLabel(e)}
          //     </div>
          //     {/* <div className={labelArrow} /> */}
          //   </div>
          // )
        )}
        {addComponent}
      </div>
      {entity != null && (
        <div className={cx(flex, entityContainer, grow, justifyCenter)}>
          {children({entity, disabled, readOnly})}
        </div>
      )}
    </div>
  );
}

export interface EntityChooserLabelProps<T extends IAbstractEntity> {
  entity: T;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface CustomEntityChooserLabel<T extends IAbstractEntity>
  extends EntityChooserLabelProps<T> {
  customLabelStyle?: (entity: T) => string | undefined;
}

export function DefaultEntityChooserLabel<T extends IAbstractEntity>({
  entity,
  selected,
  disabled,
  onClick,
  children,
  customLabelStyle,
}: React.PropsWithChildren<CustomEntityChooserLabel<T>>) {
  return (
    <div
      key={entity.id}
      className={cx(flex, flexRow, entityChooserLabelContainer)}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      <div
        className={cx(
          entityChooserLabelStyle(disabled),
          customLabelStyle && customLabelStyle(entity),
          {
            [activeEntityChooserLabel]: selected,
          },
        )}
      >
        {children}
      </div>
    </div>
  );
}
