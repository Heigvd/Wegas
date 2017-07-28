declare module 'draft-convert' {
    import { ContentState, DraftInlineStyle } from 'draft-js';
    import { OrderedSet } from 'draft-js/node_modules/immutable/dist/immutable-nonambient';
    interface ConvertToHTMLOption {
        styleToHTML?: (style: string) => JSX.Element | void;
        entityToHTML?: (
            entity: { type: string; data: any },
            originalText: string
        ) => JSX.Element | void | { start: string; end: string };
        blockToHTML?: (
            block: { type: string; data: any; text: string; depth: number }
        ) => JSX.Element | void;
    }
    function convertToHTML(contentState: ContentState): string;
    function convertToHTML(
        option: ConvertToHTMLOption
    ): (contentState: ContentState) => string;

    interface ConvertFromHTMLOption {
        htmlToStyle?: (
            nodeName: string,
            node: HTMLElement,
            currentStyle: DraftInlineStyle
        ) => DraftInlineStyle;
        htmlToEntity?: (nodeName: string, node: HTMLElement) => string | void;
        htmlToBlock?: (
            nodeName: string,
            node: HTMLElement
        ) => string | { type: string; data: any } | void;
    }
    function convertFromHTML(
        html: string,
        opt: { flat?: boolean },
        DOMBuilder?: Function
    ): ContentState;
    function convertFromHTML(
        option: ConvertFromHTMLOption
    ): (html: string) => ContentState;
}
