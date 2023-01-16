import { css, cx } from '@emotion/css';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import {
  autoScroll,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
  halfOpacity,
  justifyCenter,
  justifyStart,
} from '../css/classes';
import { deepDifferent } from './Hooks/storeHookFactory';
import { themeVar } from './Theme/ThemeVars';

const entityChooser = css({
  width: '100%',
  overflow: 'hidden',
});

const entityContainer = css({
  flex: '50%',
  padding: '10px',
  overflow: 'auto',
});

const labelList = css({
  flex: '50%',
  padding: '10px',
  minWidth: '90px',
  overflow: 'auto',
});

const labelListMobile = css({
  padding: '10px',
  maxWidth: '100%',
  overflow: 'auto',
});

export const entityChooserLabelStyle = (disabled?: boolean) =>
  cx(
    css({
      fontWeight: 'bold',
      backgroundColor: themeVar.colors.BackgroundColor,
      padding: '15px',
      color: themeVar.colors.DarkTextColor,
      borderBottom: '1px solid black',
      ...(!disabled
        ? {
            '&:hover': {
              backgroundColor: themeVar.colors.SecondaryBackgroundColor,
              cursor: 'pointer',
            },
          }
        : {}),
    }),
    expandWidth,
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
    backgroundColor: themeVar.colors.SecondaryBackgroundColor,
    boxShadow: 'none',
  },
  /*
    borderLeft: `20px solid ${themeVar.colors.PrimaryColor}`,
 */
  /*
      borderLeft: `20px solid ${themeVar.colors.ActiveColor}`,
  */
);

interface LabelGeneratorProps<E extends IAbstractEntity> {
  entity: E;
  selected: boolean;
  EntityLabel: React.FunctionComponent<EntityChooserLabelProps<E>>;
  setEntity: React.Dispatch<React.SetStateAction<E | null | undefined>>;
}

function LabelGenerator<E extends IAbstractEntity>(
  props: LabelGeneratorProps<E>,
): JSX.Element {
  return (
    <props.EntityLabel
      entity={props.entity}
      selected={props.selected}
      onClick={() =>
        props.setEntity((oldEntity: E) => {
          if (deepDifferent(props.entity, oldEntity)) {
            return props.entity;
          } else {
            return null;
          }
        })
      }
    />
  );
}

interface EntityChooserProps<E extends IAbstractEntity>
  extends DisabledReadonly {
  entities: E[];
  children: React.FunctionComponent<{ entity: E } & DisabledReadonly>;
  // entityLabel: (entity: E) => React.ReactNode;
  EntityLabel: React.FunctionComponent<EntityChooserLabelProps<E>>;
  // customLabelStyle?: (entity: E) => string | undefined;
  autoOpenFirst?: boolean;
  addComponent?: React.ReactNode;
  noSelectionMessage?: string;
}

export function EntityChooser<E extends IAbstractEntity>({
  entities,
  children: Children,
  EntityLabel,
  // customLabelStyle,
  autoOpenFirst,
  disabled,
  readOnly,
  addComponent,
  noSelectionMessage,
}: EntityChooserProps<E>) {
  const [entity, setEntity] = React.useState<E | null>();
  const [mobile, setMobile] = React.useState<boolean>();

  const resizeObserver = React.useRef<ResizeObserver | undefined>();

  const setRef = React.useCallback((element: HTMLDivElement | null) => {
    if (resizeObserver.current != null) {
      resizeObserver.current.disconnect();
      resizeObserver.current = undefined;
    }

    if (element != null) {
      //n.current = element;

      const ro = new ResizeObserver(() => {
        if (element != null) {
          const rect = element.getBoundingClientRect();

          setMobile(rect.width < 768);
        }
      });

      ro.observe(element);
      resizeObserver.current = ro;
    }
  }, []);

  React.useEffect(() => {
    setEntity(oldEntity => {
      if (oldEntity === null) {
        return null;
      } else if (oldEntity === undefined && autoOpenFirst) {
        return entities[0];
      } else {
        return oldEntity;
      }
    });
  }, [autoOpenFirst, entities]);

  React.useEffect(() => {
    setEntity(oldEntity => {
      if (entities.find(e => e.id === oldEntity?.id)) {
        return oldEntity;
      } else {
        return undefined;
      }
    });
  }, [entities]);

  if (mobile) {
    return (
      <div
        className={cx(flex, flexColumn, entityChooser, autoScroll, {
          [halfOpacity]: disabled,
        })}
        ref={setRef}
      >
        {entity == undefined ? (
          <div className={cx(flex, flexColumn, labelListMobile)}>
            {entities.map(e => (
              <LabelGenerator
                key={e.id}
                entity={e}
                selected={false}
                setEntity={setEntity}
                EntityLabel={EntityLabel}
              />
            ))}
            {addComponent}
          </div>
        ) : (
          <div>
            <div className={cx(flex, flexColumn, labelListMobile)}>
              <LabelGenerator
                entity={entity}
                selected={true}
                setEntity={setEntity}
                EntityLabel={EntityLabel}
              />
              <p>hello</p>
              {addComponent}
            </div>
            <div className={cx(flex, entityContainer, grow, justifyStart)}>
              <Children
                entity={entity}
                disabled={disabled}
                readOnly={readOnly}
              />
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div
        className={cx(flex, flexRow, entityChooser, {
          [halfOpacity]: disabled,
        })}
        ref={setRef}
      >
        <div className={cx(flex, flexColumn, labelList)}>
          {entities.map(e => (
            <LabelGenerator
              key={e.id}
              entity={e}
              selected={e.id === entity?.id}
              setEntity={setEntity}
              EntityLabel={EntityLabel}
            />
          ))}
          {addComponent}
        </div>
        {entity != null ? (
          <div className={cx(flex, entityContainer, justifyStart)}>
            <Children entity={entity} disabled={disabled} readOnly={readOnly} />
          </div>
        ) : (
          <div className={cx(flex, entityContainer, justifyCenter)}>
            {noSelectionMessage}
          </div>
        )}
      </div>
    );
  }
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
      className={cx(flex, flexRow, 'wip-label-parent')}
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
          'wip-label-child',
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
