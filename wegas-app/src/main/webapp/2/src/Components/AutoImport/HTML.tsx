import * as React from 'react';
/**
 * HTML widget
 * @param props
 */
export default function HTML(props: { text: string }) {
  return (
    <div
      style={{ display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: props.text }}
    />
  );
}
