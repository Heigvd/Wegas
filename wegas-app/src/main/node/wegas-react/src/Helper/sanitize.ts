import { fileURL } from '../API/files.api';
import { werror } from './wegaslog';

// detect youtube url
const YOUTUBE_PATTERN =
  /^(?:https?:)?\/\/www\.youtube(?:-nocookie)?.com\/embed\/(.*)$/;

/**
 * Remove all tag matching the given name within the given html element
 */
function removeTag(doc: HTMLElement, tagName: string) {
  const list = doc.getElementsByTagName(tagName);
  for (let i = 0; i < list.length; i++) {
    list[i].remove();
  }
}

/**
 * Clean given html and returns sanitized version.
 * it will:
 *  remove script tags
 *  remove link tags
 *  remove all onXXX attribute
 *  secure iframe
 *  prevent password autofill in form
 */
export default function sanitize(html: string): string {
  if (html) {
    if (typeof html === 'string') {
      let root;
      // table element must be set in a parent of the correct type
      if (html.startsWith('<tr')) {
        root = document.createElement('tbody');
      } else if (html.startsWith('<tbody')) {
        root = document.createElement('table');
      } else if (html.startsWith('<thead')) {
        root = document.createElement('table');
      } else if (html.startsWith('<th')) {
        root = document.createElement('thead');
      } else if (html.startsWith('<colgroup')) {
        root = document.createElement('table');
      } else {
        // any other content can be set within a div
        root = document.createElement('div');
      }
      root.innerHTML = html;
      // remove script and link tags
      removeTag(root, 'script');
      removeTag(root, 'link');

      // force iframe to be sandboxed
      const iframes = root.getElementsByTagName('iframe');
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        // One shall not set allow-same-origin EVER
        // But embedding youtube videos requires it...
        // Youtube sucks
        // youtube wants to track you

        // So if the src match a youtube video,
        // the iframe is nto secured
        const src = iframe.getAttribute('src');
        let fallback = true;

        if (src) {
          const match = src.match(YOUTUBE_PATTERN);
          if (match) {
            fallback = false;
            // Youtube really sucks
            // so we force using RGPD compliant url
            iframe.setAttribute(
              'src',
              'https://www.youtube-nocookie.com/embed/' + match[1],
            );
          } else if (src.startsWith('http://')) {
            // force https
            iframe.setAttribute('src', src.replace('http://', 'https://'));
          }
        }

        if (fallback) {
          // other cases => sandbox
          iframe.setAttribute('sandbox', 'allow-scripts');
        }
      }

      // prevent password auto fill by browser add-on
      const inputs = root.querySelectorAll("input[type='password']");
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].setAttribute('autocomplete', 'new-password');
      }

      // remove all onEvent attributes
      // (no CSS way to select all node wih on* attributes, let's iterate over and over...)
      const all = root.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        const item = all[i];
        for (let j = 0; j < item.attributes.length; j++) {
          const attr = item.attributes[j];
          if (attr.name.startsWith('on')) {
            item.removeAttribute(attr.name);
          }
        }
      }

      return root.innerHTML;
    } else {
      werror(`Could not sanitize non-string argument! ${html}`);
    }
  }
  return '';
}

/**
 * Replace data-file attribute with complete href and src
 * @param {string} content
 */
 export function toFullUrl(content?: string) {
  let updated = content || '';
  if (updated) {
      updated = updated.replace(
          new RegExp('data-file="([^"]*)"', 'gi'),
          `src="${fileURL('')}$1"
           href="${fileURL('')}$1"`,
      ); // @hack Place both href and src so it
      // will work for both <a> and <img>
      // elements
  }
  return updated;
}

/**
* Replace href/src with injector style data-file attribute
* @param {string} content
*/
export function toInjectorStyle(content: string) {
  
  return content
      .replace(
          new RegExp('((src|href)="[^"]*/rest/GameModel/[^"]*/File/read/([^"]*)")', 'gi'),
          'data-file="$3"',
      ) // Replace absolute path with injector style path
  
}
