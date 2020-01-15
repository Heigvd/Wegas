import { library, IconName } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, Props } from '@fortawesome/react-fontawesome';

library.add(fas);

export type Icon = IconName | Props;

/**
 * see https://github.com/FortAwesome/Font-Awesome/issues/14774
 * @param icon icon to render
 * @param def icon to use if first icon is not defined
 */
export function withDefault(
  icon: IconName | undefined | null,
  def: IconName,
): IconName {
  if (icon != null) return icon;
  return def;
}
export const FontAwesome = FontAwesomeIcon;
