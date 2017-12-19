import { css } from 'glamor';
import React from 'react';

const style = css({
    paddingBottom: 5,
    width: '100%',
    position: 'relative',
});
export default function Statement(props: {
    children: (React.ComponentClass<any> | React.SFC<any>)[];
}) {
    return <div className={style.toString()}>{props.children}</div>;
}
