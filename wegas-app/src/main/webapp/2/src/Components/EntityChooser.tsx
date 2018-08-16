import * as React from 'react';
import { SizedDiv } from './SizedDiv';
import { primaryDark, primaryLight, primary } from './Theme';
import { css, cx } from 'emotion';

const INLINE_SIZE_BREAKPOINT = 600;

const cursorStyle = css({ cursor: 'pointer' });
const itemStyle = css({
  border: '1px solid',
  lineHeight: '2',
});
const listStyle = css({
  minWidth: '15em',
});
const flexStyle = css({
  display: 'flex',
  flexDirection: 'row',
});
const displayStyle = css({
  flex: '1 1 auto',
});

interface EntityChooserProps<E extends IWegasEntity> {
  entities: E[];
  children: React.ComponentType<{
    entity: E;
  }>;
  entityLabel: (entity: E) => React.ReactNode;
}
export class EntityChooser<E extends IWegasEntity> extends React.Component<
  EntityChooserProps<E>,
  {
    entity?: E;
  }
> {
  static getDerivedStateFromProps(
    nextProps: EntityChooserProps<IWegasEntity>,
    state: { entity?: IWegasEntity },
  ) {
    if (state.entity == null) {
      return null;
    }
    const id = state.entity.id;
    const cls = state.entity['@class'];
    const newEntity = nextProps.entities.find(
      e => e['@class'] === cls && e.id === id,
    );
    return { entity: newEntity };
  }

  state: { entity?: E } = { entity: this.props.entities[0] };

  render() {
    const { entity } = this.state;
    return (
      <SizedDiv>
        {size => {
          let i: number | undefined;
          const elements = this.props.entities.map((e, index) => {
            if (e === entity) {
              i = index;
            }
            return (
              <div
                className={cx(
                  {
                    [primaryDark]: e === entity,
                    [primaryLight]: e !== entity,
                  },
                  itemStyle,
                  cursorStyle,
                )}
                key={e.id}
                onClick={() => this.setState({ entity: e })}
              >
                {this.props.entityLabel(e)}
              </div>
            );
          });
          if (size === undefined || size.width > INLINE_SIZE_BREAKPOINT) {
            return (
              <div className={flexStyle}>
                <div className={listStyle}>{elements}</div>
                <div className={displayStyle}>
                  {entity != null && (
                    <div className={cx(itemStyle, primary)}>
                      {this.props.entityLabel(entity)}
                    </div>
                  )}
                  {entity != null && <this.props.children entity={entity} />}
                </div>
              </div>
            );
          }
          if (i !== undefined) {
            elements.splice(
              i + 1,
              0,
              <div key="display" className={displayStyle}>
                {entity != null && <this.props.children entity={entity} />}
              </div>,
            );
          }
          return (
            <div>
              <div className={listStyle}>{elements}</div>
            </div>
          );
        }}
      </SizedDiv>
    );
  }
}
