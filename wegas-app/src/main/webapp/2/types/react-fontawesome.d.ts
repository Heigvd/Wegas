declare module '@fortawesome/react-fontawesome' {
  import { CSSProperties } from 'react';
  import {
    IconProp,
    SizeProp,
    FlipProp,
    RotateProp,
    PullProp,
    Transform,
    IconName,
    FaSymbol,
  } from '@fortawesome/fontawesome';
  interface FontAwesomeProps {
    icon: IconProp;
    size?: SizeProp;
    flip?: FlipProp;
    rotate?: RotateProp;
    pull?: PullProp;
    spin?: boolean;
    pulse?: boolean;
    fixedWidth?: boolean;
    border?: boolean;
    listItem?: boolean;
    className?: string;
    symbol?: FaSymbol;
    mask?: IconProp;
    transform?: Transform | string;
    style?: CSSProperties;
  }
  export default function FontAwesomeIcon(props: FontAwesomeProps): JSX.Element;
}
