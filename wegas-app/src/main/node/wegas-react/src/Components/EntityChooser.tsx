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
    justifyStart, textJustify,
} from '../css/classes';
import { classNameOrEmpty } from '../Helper/className';
import { deepDifferent } from './Hooks/storeHookFactory';
import { themeVar } from './Theme/ThemeVars';

const entityChooser = css({
  width: '100%',
  overflow: 'hidden',
  gap: '10px',
});

const entityContainer = css({
  flex: '70%',
  padding: '10px',
  overflow: 'auto',
});

const labelList = css({
  flex: '30%',
  padding: '10px',
  minWidth: '90px',
  overflow: 'auto',
});

const labelListMobile = css({
  padding: '10px',
  maxWidth: '100%',
  overflow: 'auto',
});

export const defaultEntityDisplay = cx(
    textJustify,
    css(
        {
            flexGrow: 1,
            width: 'auto',
            marginRight: 'auto',
            marginLeft: 'auto',
            minWidth: '50ch',
            maxWidth: '75ch',
            overflowWrap: 'break-word', // Prevents <75ch text from overflowing
            hyphens: 'auto',
        }
    )
);

export const entityChooserLabelStyle = (disabled?: boolean) =>
  cx(
    css({
      position: 'relative',
      padding: '10px',
      color: themeVar.colors.DarkTextColor,
      borderRadius: themeVar.dimensions.BorderRadius,
      marginTop: '5px',
      marginBottom: '5px',
      boxShadow: `2px 2px 6px rgba(0, 0, 0, 0.2)`,
      ...(!disabled
        ? {
            '&:hover': {
              cursor: 'pointer',
              boxShadow: `2px 2px 6px 2px rgba(0, 0, 0, 0.4)`,
              zIndex: 1,
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
  // marginBottom: '10px',
  /* [`&>.${labelArrow}`]: {
        borderLeft: `20px solid ${themeVar.colors.DisabledColor}`,
      }, */
});

export const activeEntityChooserLabel = css(
  {
    backgroundColor: themeVar.colors.PrimaryColor,
    color: themeVar.colors.LightTextColor,
    boxShadow: `2px 2px 6px 2px rgba(0, 0, 0, 0.2)`,
    zIndex: 1,
    borderBottomColor: themeVar.colors.PrimaryColor,
  },
  /*
      borderLeft: `20px solid ${themeVar.colors.PrimaryColor}`,
   */
  /*
        borderLeft: `20px solid ${themeVar.colors.ActiveColor}`,
    */
) + ' wegas-entity-chooser__active';

interface LabelGeneratorProps<E extends IAbstractEntity> {
  entity: E;
  selected: boolean;
  EntityLabel: React.FunctionComponent<EntityChooserLabelProps<E>>;
  setEntity: React.Dispatch<React.SetStateAction<E | null | undefined>>;
  mobile?: boolean;
}

function LabelGenerator<E extends IAbstractEntity>(
  props: LabelGeneratorProps<E>,
): JSX.Element {
  return (
    <props.EntityLabel
      entity={props.entity}
      selected={props.selected}
      mobile={props.mobile}
      onClick={() =>
        props.setEntity((oldEntity: E) => {
          if (deepDifferent(props.entity, oldEntity)) {
            return props.entity;
          } else {
            return props.mobile ? null : oldEntity;
          }
        })
      }
    />
  );
}

type childrenType<E> = { entity: E } & DisabledReadonly;

interface EntityChooserProps<E extends IAbstractEntity>
  extends DisabledReadonly,
    ClassStyleId {
  entities: E[];
  children: (props: childrenType<E>) => React.ReactNode; //React.FunctionComponent<{ entity: E } & DisabledReadonly> ;
  // entityLabel: (entity: E) => React.ReactNode;
  EntityLabel: React.FunctionComponent<EntityChooserLabelProps<E>>;
  // customLabelStyle?: (entity: E) => string | undefined;
  autoOpenFirst?: boolean;
  mobileDisplay?: boolean;
  addComponent?: React.ReactNode;
  noSelectionMessage?: string;
}

export function EntityChooser<E extends IAbstractEntity>({
  entities,
  children,
  EntityLabel,
  // customLabelStyle,
  autoOpenFirst,
  mobileDisplay,
  disabled,
  readOnly,
  addComponent,
  noSelectionMessage,
  className,
  style,
}: EntityChooserProps<E>) {
  const [entity, setEntity] = React.useState<E | null>();
  const [mobile, setMobile] = React.useState<boolean>();

  const resizeObserver = React.useRef<ResizeObserver | undefined>();

  const setRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (resizeObserver.current != null) {
        resizeObserver.current.disconnect();
        resizeObserver.current = undefined;
      }

      if (element != null) {
        //n.current = element;

        const ro = new ResizeObserver(() => {
          if (element != null) {
            const rect = element.getBoundingClientRect();

            mobileDisplay ? setMobile(rect.width < 768) : setMobile(false);
          }
        });

        ro.observe(element);
        resizeObserver.current = ro;
      }
    },
    [mobileDisplay],
  );

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
        className={
          cx(flex, flexColumn, entityChooser, autoScroll, {
            [halfOpacity]: disabled,
          }) + classNameOrEmpty(className)
        }
        style={style}
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
                mobile={true}
              />
              {addComponent}
            </div>
            <div className={cx(flex, entityContainer, grow, justifyStart)}>
              {children({ entity, disabled, readOnly })}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div
        className={
          cx(flex, flexRow, entityChooser, {
            [halfOpacity]: disabled,
          }) + classNameOrEmpty(className)
        + ' wegas-entity-chooser'}
        style={style}
        ref={setRef}
      >
        <div className={cx(flex, flexColumn, labelList) + ' wegas-entity-chooser__list'}>
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
          <div className={cx(flex, entityContainer, justifyStart) + ' wegas-entity-chooser__display'}>
            {children({ entity, disabled, readOnly })}
          </div>
        ) : (
          <div className={cx(flex, entityContainer, justifyCenter) + ' wegas-entity-chooser__no-selection'}>
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
  mobile?: boolean;
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
      className={cx(flex, flexRow)}
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
        ) + ' wegas-entity-chooser__choice'}
      >
        {children}
      </div>
    </div>
  );
}
