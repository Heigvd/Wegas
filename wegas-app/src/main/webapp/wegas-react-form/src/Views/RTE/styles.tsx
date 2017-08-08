import * as React from 'react';
import { isMatch } from 'lodash';
import { Entity, CompositeDecorator } from 'draft-js';
import {
    convertFromHTML,
    convertToHTML,
    ConvertToHTMLOption,
} from 'draft-convert';
import { BACKGROUND_COLORS, FOREGROUND_COLORS } from './color';
import { FONT_FAMILY, FONT_SIZE } from './font';
import { Link, linkDecorator } from './link';
import { imageDecorator, videoDecorator } from './media';

export const decorators = new CompositeDecorator([
    linkDecorator,
    imageDecorator,
    videoDecorator,
]);

export const inlineStyles: { [name: string]: React.CSSProperties } = {
    ...BACKGROUND_COLORS,
    ...FOREGROUND_COLORS,
    ...FONT_FAMILY,
    ...FONT_SIZE,
};
export const HTMLToState = convertFromHTML({
    htmlToStyle: (nodeName, node, currentStyle) => {
        let style = currentStyle;
        Object.keys(inlineStyles).forEach(k => {
            if (isMatch(node.style, inlineStyles[k])) {
                style = style.add(k);
            }
        });
        return style;
    },
    htmlToEntity: (nodeName, node) => {
        if (nodeName === 'a') {
            // this will deprecate. fix https://github.com/HubSpot/draft-convert/pull/82
            return Entity.create('LINK', 'MUTABLE', {
                url: node.getAttribute('href'),
            });
        }
        if (nodeName === 'img') {
            return Entity.create('IMAGE', 'IMMUTABLE', {
                url: node.getAttribute('src'),
            });
        }
        if (nodeName === 'video') {
            return Entity.create('VIDEO', 'IMMUTABLE', {
                url: node.getAttribute('src'),
            });
        }
    },
    htmlToBlock: (nodeName, node) => {
        if (
            (nodeName === 'figure' &&
                node.firstChild &&
                (node.firstChild.nodeName === 'IMG' ||
                    node.firstChild.nodeName === 'VIDEO')) ||
            nodeName === 'img' ||
            nodeName === 'video'
        ) {
            return 'atomic';
        }
    },
});
const options: ConvertToHTMLOption = {
    styleToHTML: style => {
        if (inlineStyles.hasOwnProperty(style)) {
            return <span style={inlineStyles[style]} />;
        }
    },
    entityToHTML: (entity, originalText) => {
        if (entity.type === 'LINK') {
            return Link(entity.data);
        }
        if (entity.type === 'IMAGE') {
            return {
                start: "<img src='" + entity.data.url + "'>",
                end: '</img>',
            };
        }
        if (entity.type === 'VIDEO') {
            return {
                start: "<video src='" + entity.data.url + "' controls>",
                end: '</video>',
            };
        }
    },
    blockToHTML: block => {
        if (block.type === 'atomic') {
            return <figure />;
        }
    },
};
export const StateToHTML = convertToHTML(options);
