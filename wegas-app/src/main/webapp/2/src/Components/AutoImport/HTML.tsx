import * as React from 'react';
import { sanitize } from '../../Helper/sanitize';

/**
 * HTML widget
 * @param props
 * @deprecated use Outputs/Text
 */
export default function HTML(props: { text: string }) {
  return (
    <div
      style={{ display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: sanitize(props.text) }}
    />
  );
}
