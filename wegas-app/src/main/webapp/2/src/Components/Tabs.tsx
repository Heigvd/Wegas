import * as React from 'react';
import { Toolbar } from './Toolbar';
import { css, cx } from 'emotion';
import { themeVar } from './Style/ThemeVars';
import { layoutStyle } from '../css/classes';

export function tabsStyle(isChild: boolean | undefined, isActive: boolean | undefined){
    if (isChild) {
     return(
      cx({
        [childActiveTabStyle]: isActive,
        [childInactiveTabStyle]: !isActive,
      })
     );
    }
    else {
      return (
        cx({
          [activeTabStyle]: isActive,
          [inactiveTabStyle]: !isActive,
        })
      );
    }
}
export const tabStyle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  marginLeft: '6px',
  padding: '10px 10px',
  borderRadius: themeVar.Common.dimensions.BorderRadius + ' ' + themeVar.Common.dimensions.BorderRadius + ' 0 0' ,
  textTransform: 'uppercase',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '120%',
  button: {
    paddingRight: 0,
  },

});
//TODO delete if never used, left for now in case something added afterward
export const inactiveTabStyle = css({
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  color: themeVar.Common.colors.ActiveColor,
  button: {
    color: themeVar.Common.colors.DisabledColor,
  },
  '&:hover': {
    backgroundColor: themeVar.Common.colors.HeaderColor,
    button: {
      '&:hover': {
        color: themeVar.Common.colors.ActiveColor,
      }
    },
  }
 });
export const activeTabStyle = css({
  color: themeVar.Common.colors.LightTextColor,
  backgroundColor: themeVar.Common.colors.ActiveColor,
  '&:hover': {
    backgroundColor: themeVar.Common.colors.ActiveColor,
    'button.wegas-btn.iconOnly:hover': {
        color: themeVar.Common.colors.LightTextColor,
      }
    },
});
export const childInactiveTabStyle = css({
  backgroundColor: themeVar.Common.colors.ActiveColor,
  border: '1px solid ' + themeVar.Common.colors.LightTextColor,
  borderBottom: '1px solid transparent',
  color: themeVar.Common.colors.LightTextColor,
  textTransform: 'none',
  padding: '2px 10px',
  button: {
    color: themeVar.Common.colors.LightTextColor,
  },
  '&:hover': {
    backgroundColor: themeVar.Common.colors.PrimaryColor,
    border: '1px solid transparent',
    'button:hover': {
        color: themeVar.Common.colors.ActiveColor,
      }
    },
 });
export const childActiveTabStyle = css({
  color: themeVar.Common.colors.ActiveColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  textTransform: 'none',
  padding: '2px 10px',
  button: {
    color: themeVar.Common.colors.DisabledColor,
  },
  '&:hover': {
    backgroundColor: themeVar.Common.colors.BackgroundColor,
    'button.wegas-btn.iconOnly': {
      '&:hover': {
        color: themeVar.Common.colors.ActiveColor,
      }
    },
  }
});

export const plusTabStyle = css({
  backgroundColor: 'transparent',
  color: themeVar.Common.colors.DisabledColor,
  display: 'flex',
  alignItems: 'center',
  button: {
    color: themeVar.Common.colors.DisabledColor,
  }
})
export const childrenPlusTabStyle = css({
  backgroundColor: 'transparent',
  color: themeVar.Common.colors.LightTextColor,
  display: 'flex',
  alignItems: 'center',
  button: {
    color: themeVar.Common.colors.LightTextColor,
    '&:hover': {
      color: themeVar.Common.colors.DisabledColor,
    }
  }
})


interface TabLayoutProps {
  active?: number;
  vertical: boolean;
  tabs: (React.ReactChild | null)[];
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
        <Toolbar.Header className={layoutStyle}>
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
}: {
  active: boolean;
  children: React.ReactChild | null;
  onClick: () => void;
  className?: string;
}) {
  if (children === null) {
    return null;
  }
  return (
    <div
      className={cx(tabStyle, className, {
        [activeTabStyle]: active,
        [inactiveTabStyle]: !active,
      })}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
