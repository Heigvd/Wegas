import * as React from 'react';
import { Toolbar } from './Toolbar';
import { css, cx } from 'emotion';
import { childrenHeaderStyle, headerStyle } from '../css/classes';
import { themeVar } from './Theme/ThemeVars';

export function tabsStyle(
  isChild: boolean | undefined,
  isActive: boolean | undefined,
) {
  if (isChild) {
    return cx({
      [childActiveTabStyle]: isActive,
      [childInactiveTabStyle]: !isActive,
    });
  } else {
    return cx({
      [activeTabStyle]: isActive,
      [inactiveTabStyle]: !isActive,
    });
  }
}
export const tabStyle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  marginLeft: '6px',
  padding: '10px 10px',
  borderRadius:
    themeVar.dimensions.BorderRadius +
    ' ' +
    themeVar.dimensions.BorderRadius +
    ' 0 0',
  textTransform: 'uppercase',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '120%',
  button: {
    padding: '0 0 0 10px',
  },
});
export const inactiveTabStyle = css({
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.ActiveColor,
  height: '52px',
  button: {
    color: themeVar.colors.DisabledColor,
    '&:hover': {
      color: themeVar.colors.ActiveColor,
    },
  },
  '&:hover': {
    backgroundColor: themeVar.colors.HeaderColor,
  },
});
export const activeTabStyle = css({
  color: themeVar.colors.LightTextColor,
  backgroundColor: themeVar.colors.ActiveColor,
  height: '52px',
  button: {
    color: themeVar.colors.LightTextColor,
    '&.wegas.wegas-iconbtn:hover': {
      color: themeVar.colors.DisabledColor,
    },
  },
});
export const childInactiveTabStyle = css({
  backgroundColor: themeVar.colors.ActiveColor,
  border: '1px solid ' + themeVar.colors.LightTextColor,
  borderBottom: '1px solid transparent',
  color: themeVar.colors.LightTextColor,
  textTransform: 'none',
  padding: '6px 10px',
  button: {
    color: themeVar.colors.LightTextColor,
  },
  '&:hover': {
    backgroundColor: themeVar.colors.PrimaryColor,
    border: '1px solid transparent',
  },
});
export const childActiveTabStyle = css({
  color: themeVar.colors.ActiveColor,
  backgroundColor: themeVar.colors.BackgroundColor,
  textTransform: 'none',
  padding: '6px 10px',
  button: {
    color: themeVar.colors.DisabledColor,
  },
});

export const plusTabStyle = css({
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  'button.iconOnly': {
    color: themeVar.colors.DisabledColor,
  },
});
export const childrenPlusTabStyle = css({
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  'button.wegas.wegas-btn.iconOnly': {
    color: themeVar.colors.LightTextColor,
    '&:hover': {
      color: themeVar.colors.DisabledColor,
    },
  },
});

interface TabLayoutProps {
  active?: number;
  vertical: boolean;
  tabs: (React.ReactChild | null)[];
  areChildren?: boolean;
}
export class TabLayout extends React.Component<
  TabLayoutProps,
  { active: number; renderedFlag: number }
> {
  static defaultProps = {
    vertical: false,
  };
  readonly state = {
    active: this.props.active || 0,
    renderedFlag: this.props.active || 0,
  };

  render() {
    return (
      <Toolbar vertical={this.props.vertical}>
        <Toolbar.Header
          className={cx({
            [childrenHeaderStyle]:
              this.props.areChildren !== undefined && this.props.areChildren,
            [headerStyle]: !this.props.areChildren,
          })}
        >
          {this.props.tabs.map((t, i) => {
            return (
              <Tab
                key={i}
                active={i === this.state.active}
                onClick={() =>
                  this.setState(oldState => {
                    return {
                      active: i,
                      renderedFlag: oldState.renderedFlag | (i + 1),
                    };
                  })
                }
                isChild={this.props.areChildren}
              >
                {t}
              </Tab>
            );
          })}
        </Toolbar.Header>
        <Toolbar.Content>
          {React.Children.map(this.props.children, (c, i) => {
            return (
              (i === this.state.active ||
                (this.state.renderedFlag & (i + 1)) > 0) && (
                <div
                  style={{
                    display: i === this.state.active ? 'flex' : 'none',
                    flex: '1 1 auto',
                  }}
                >
                  {c}
                </div>
              )
            );
          })}
        </Toolbar.Content>
      </Toolbar>
    );
  }
}
function Tab({
  active,
  onClick,
  children,
  className,
  isChild,
}: {
  active: boolean;
  children: React.ReactChild | null;
  onClick: () => void;
  className?: string;
  isChild?: boolean;
}) {
  if (children === null) {
    return null;
  }
  return (
    <div
      className={cx(tabStyle, className, tabsStyle(isChild, active))}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
