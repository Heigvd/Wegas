/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.helper;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.messaging.persistence.Attachment;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import javax.faces.component.html.HtmlOutputText;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * @author maxence
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class UIHelper {

    public static final String CSS_CLASS_PREFIX = " wegas-pdf-";

    public static final String CSS_CLASS_COLUMN = CSS_CLASS_PREFIX + "column";
    public static final String CSS_CLASS_COLUMNS = CSS_CLASS_PREFIX + "columns";

    public static final String CSS_CLASS_CONTENT = CSS_CLASS_PREFIX + "content";
    public static final String CSS_CLASS_ERROR = CSS_CLASS_PREFIX + "error";
    public static final String CSS_CLASS_FOLDER = CSS_CLASS_PREFIX + "folder";

    public static final String CSS_CLASS_MAIN_IMAGE = CSS_CLASS_PREFIX + "title-image";
    public static final String CSS_CLASS_MAIN_TITLE = CSS_CLASS_PREFIX + "title";

    public static final String CSS_CLASS_MENU = CSS_CLASS_PREFIX + "menu";

    public static final String CSS_CLASS_MESSAGE_TITLE = CSS_CLASS_PREFIX + "message-container-title";
    public static final String CSS_CLASS_MESSAGE_CONTAINER = CSS_CLASS_PREFIX + "message-container";
    public static final String CSS_CLASS_MESSAGE_HEADER = CSS_CLASS_PREFIX + "message-header";
    public static final String CSS_CLASS_MESSAGE_HEADER_FIRSTLINE = CSS_CLASS_PREFIX + "message-firstline";
    public static final String CSS_CLASS_MESSAGE_FROM = CSS_CLASS_PREFIX + "message-from";
    public static final String CSS_CLASS_MESSAGE_TO = CSS_CLASS_PREFIX + "message-to";
    public static final String CSS_CLASS_MESSAGE_DATE = CSS_CLASS_PREFIX + "message-date";
    public static final String CSS_CLASS_MESSAGE_SUBJECT = CSS_CLASS_PREFIX + "message-subject";

    public static final String CSS_CLASS_PICTURE = CSS_CLASS_PREFIX + "picture";
    public static final String CSS_CLASS_PICTURES = CSS_CLASS_PREFIX + "pictures-collection";

    public static final String CSS_CLASS_PROPERTY = CSS_CLASS_PREFIX + "property";
    public static final String CSS_CLASS_PROPERTY_KEY = CSS_CLASS_PREFIX + "property-key";
    public static final String CSS_CLASS_PROPERTY_VALUE = CSS_CLASS_PREFIX + "property-value";
    public static final String CSS_CLASS_PROPERTY_VALUE_NA = CSS_CLASS_PREFIX + "property-value-na";
    public static final String CSS_CLASS_PROPERTY_VALUE_TEXTAREA = CSS_CLASS_PREFIX + "property-value-textarea";

    public static final String CSS_CLASS_SOURCE_CODE = CSS_CLASS_PREFIX + "code";

    public static final String CSS_CLASS_TEXT_CONTAINER = CSS_CLASS_PREFIX + "text-container";

    public static final String CSS_CLASS_VARIABLE_CONTAINER = CSS_CLASS_PREFIX + "variable-container";
    public static final String CSS_CLASS_VARIABLE_SUBTITLE = CSS_CLASS_PREFIX + "variable-subtitle";
    public static final String CSS_CLASS_VARIABLE_SUBSUBTITLE = CSS_CLASS_PREFIX + "variable-subsubtitle";

    public static final String CSS_CLASS_VARIABLE_TITLE = CSS_CLASS_PREFIX + "variable-title";

    public static final String CSS_CLASS_INDENT_CODE = CSS_CLASS_PREFIX + "indent-code";

    public static final String CSS_CLASS_INLINE_DIV = CSS_CLASS_PREFIX + "inline-div";

    public static final String TEXT_ACTIVE = "Active";
    public static final String TEXT_CONDITION = "Condition";
    public static final String TEXT_CONTENT = "Content";
    public static final String TEXT_DATE = "Date";
    public static final String TEXT_DEFAULT_RESULT = "Default result";
    public static final String TEXT_DEFAULT_STATE = "Default State";
    public static final String TEXT_DESCRIPTION = "";
    public static final String TEXT_DURATION = "Duration";
    public static final String TEXT_ID = "ID";
    public static final String TEXT_IMPACT_SOURCECODE = "Impact";
    public static final String TEXT_IMPACT_TEXT = "Result";
    public static final String TEXT_INDEX = "Index";
    public static final String TEXT_LABEL = "Label";
    public static final String TEXT_NAME = "Name";
    public static final String TEXT_NEXT_STATE = "Next State";
    public static final String TEXT_NOT_AVAILABLE = "[N/A]";
    public static final String TEXT_ONLY_ONCE = "Only once";
    public static final String TEXT_ON_ENTER_IMPACT = "On Enter Impact";
    public static final String TEXT_PREDECESSORS = "Predecessors";
    public static final String TEXT_REQUIERMENT_REQUIERMENTS = "Requierments";
    public static final String TEXT_TEXT = "Text";
    public static final String TEXT_MORAL = "Motivation";
    public static final String TEXT_CONFIDENCE = "Confidence";
    public static final String TEXT_FROM = "From";
    public static final String TEXT_DESTINATION = "To";
    public static final String TEXT_SUBJECT = "Subject";
    public static final String TEXT_MESSAGE = "Message";
    public static final String TEXT_SEND_MESSAGE = "Send Message";
    public static final String TEXT_MAIN_SKILL = "Mail Skill";
    public static final String TEXT_ATTACHMENTS = "Attachments";

    public static final String TEXT_MIN_VALUE = "Max Value";
    public static final String TEXT_MAX_VALUE = "Min Value";
    public static final String TEXT_VALUE = "Value";

    public static String unescapeAndTrimQuotes(String st) {
        return Helper.unescape(st).replaceAll("^\\s*\"|\"\\s*$", "");
    }

    /**
     * Start a div
     *
     * @param wr
     *
     * @throws IOException
     */
    public static void startDiv(ResponseWriter wr) throws IOException {
        startDiv(wr, null);
    }

    /**
     * Start a div with the specified CSS class.
     *
     * @see #endDiv to end the div
     *
     * @param wr
     * @param cssClass
     *
     * @throws IOException
     */
    public static void startDiv(ResponseWriter wr, String cssClass) throws IOException {
        startDiv(wr, cssClass, null);
    }

    /**
     * Start the specified element with specified Css Classes and id
     *
     * @see ResponseWriter#endElement for the closing tag
     *
     * @param wr
     * @param elem
     * @param cssClass
     * @param id
     *
     * @throws IOException
     */
    public static void startElement(ResponseWriter wr, String elem, String cssClass, String id) throws IOException {
        wr.startElement(elem, null);
        wr.writeAttribute("class", cssClass, null);

        if (id != null) {
            wr.writeAttribute("id", id, null);
        }
    }

    /**
     * Start a DIV with specified Css Classes and id
     *
     * @param wr
     * @param cssClass
     * @param id
     *
     * @throws IOException
     */
    public static void startDiv(ResponseWriter wr, String cssClass, String id) throws IOException {
        startElement(wr, "div", cssClass, id);
    }

    /**
     * end a div
     *
     * @param wr
     *
     * @throws IOException
     */
    public static void endDiv(ResponseWriter wr) throws IOException {
        wr.endElement("div");
    }

    /**
     * start a span with the specified CSS classes
     *
     * @see #endSpan
     * @param wr
     * @param cssClass
     *
     * @throws IOException
     */
    public static void startSpan(ResponseWriter wr, String cssClass) throws IOException {
        startSpan(wr, cssClass, null);
    }

    /**
     * Start a span with specified CSS class and id
     *
     * @param wr
     * @param cssClass
     * @param id
     *
     * @throws IOException
     */
    public static void startSpan(ResponseWriter wr, String cssClass, String id) throws IOException {
        startElement(wr, "span", cssClass, id);
    }

    /**
     * end a span
     *
     * @param wr
     *
     * @throws IOException
     */
    public static void endSpan(ResponseWriter wr) throws IOException {
        wr.endElement("span");
    }

    /**
     * Print a boolean property (key/value)
     *
     * @param ctx
     * @param writer
     * @param key
     * @param value
     *
     * @throws IOException
     */
    public static void printProperty(FacesContext ctx, ResponseWriter writer, String key, boolean value) throws IOException {
        printProperty(ctx, writer, key, value ? "Yes" : "No");
        writer.write("\r\n");
    }

    /**
     * Print a Object property
     *
     * @param ctx
     * @param writer
     * @param key
     * @param value
     *
     * @throws IOException
     */
    public static void printProperty(FacesContext ctx, ResponseWriter writer, String key, Object value) throws IOException {
        printProperty(ctx, writer, key, value == null ? TEXT_NOT_AVAILABLE : value.toString());
    }

    /**
     * Print a key/value property. Value as string
     *
     * @param ctx
     * @param writer
     * @param key
     * @param value
     *
     * @throws IOException
     */
    public static void printProperty(FacesContext ctx, ResponseWriter writer, String key, String value) throws IOException {
        startDiv(writer, CSS_CLASS_PROPERTY);
        printText(ctx, writer, key + ": ", CSS_CLASS_PROPERTY_KEY);
        printText(ctx, writer, value, CSS_CLASS_PROPERTY_VALUE);
        endDiv(writer);
        writer.write("\r\n");
    }

    /**
     * print key/value property with value as a text area. the text may include
     * HTML tags
     *
     * @param ctx
     * @param writer
     * @param key       the name
     * @param value     the text to print
     * @param code      add a css class if the text represents a source code
     * @param displayNA
     *
     * @throws IOException
     */
    public static void printPropertyTextArea(FacesContext ctx, ResponseWriter writer, String key, String value, boolean code, boolean displayNA) throws IOException {
        // Skip empty value for players
        if (displayNA || value != null && !value.isEmpty()) {
            startDiv(writer, CSS_CLASS_PROPERTY);
            printText(ctx, writer, key, CSS_CLASS_PROPERTY_KEY);
            printTextArea(ctx, writer, value, CSS_CLASS_PROPERTY_VALUE_TEXTAREA + (code ? " " + CSS_CLASS_SOURCE_CODE : ""), code);
            endDiv(writer);
            writer.write("\r\n");
        }
    }

    /**
     * Pretty printer for impact
     *
     * @param ctx
     * @param writer
     * @param key
     * @param script
     *
     * @throws IOException
     */
    public static void printPropertyImpactScript(FacesContext ctx, ResponseWriter writer, String key, Script script) throws IOException {

        //printText(ctx, writer, "IMPACT", CSS_CLASS_VARIABLE_TITLE);
        try {
            if (script == null) {
                printPropertyScript(ctx, writer, key, (String) null);
            } else {
                UIHelper.startScript(ctx, writer, key);
                ImpactPrinter ip = new ImpactPrinter(script.getContent());
                ip.print(ctx, writer);
                UIHelper.endScript(ctx, writer);
            }
        } catch (IOException ex) {
            // Fallback
            printPropertyScript(ctx, writer, key, script);
        }

        //printPropertyScript(ctx, writer, key, script);
    }

    /**
     * Print a script w/o pretty printer
     *
     * @param ctx
     * @param writer
     * @param key
     * @param script
     *
     * @throws IOException
     */
    public static void printPropertyScript(FacesContext ctx, ResponseWriter writer, String key, Script script) throws IOException {
        String value;
        if (script != null) {
            value = script.getContent();
        } else {
            value = TEXT_NOT_AVAILABLE;
        }
        printPropertyScript(ctx, writer, key, value);
    }

    /**
     * Print a script w/o pretty printer with script as a String
     *
     * @param ctx
     * @param writer
     * @param key
     * @param script
     *
     * @throws IOException
     */
    public static void printPropertyScript(FacesContext ctx, ResponseWriter writer, String key, String script) throws IOException {
        startScript(ctx, writer, key);
        printTextArea(ctx, writer, script, CSS_CLASS_PROPERTY_VALUE_TEXTAREA + " " + CSS_CLASS_SOURCE_CODE, true);
        endScript(ctx, writer);
        writer.write("\r\n");
    }

    /**
     * Start a script property
     *
     * @param context
     * @param writer
     * @param key
     *
     * @throws IOException
     */
    public static void startScript(FacesContext context, ResponseWriter writer, String key) throws IOException {
        startDiv(writer, CSS_CLASS_PROPERTY);
        if (key != null) {
            printText(context, writer, key, CSS_CLASS_PROPERTY_KEY);
        }
    }

    /**
     * end a script property
     *
     * @param context
     * @param writer
     *
     * @throws IOException
     */
    public static void endScript(FacesContext context, ResponseWriter writer) throws IOException {
        endDiv(writer);
    }

    /**
     * Print text with style class
     *
     * @param ctx
     * @param writer
     * @param text
     * @param style
     *
     * @throws IOException
     */
    public static void printText(FacesContext ctx, ResponseWriter writer, String text, String style) throws IOException {

        //if (text == null || text.replace("\\s", "").length() == 0) {
        if (text == null) {
            text = TEXT_NOT_AVAILABLE;
            style += " " + CSS_CLASS_PROPERTY_VALUE_NA;
        }

        HtmlOutputText t = new HtmlOutputText();
        t.setStyleClass(style);
        t.setEscape(true);
        t.setValue(text);
        t.encodeAll(ctx);
        writer.write("\r\n");

    }

    /**
     * PrettyPrinter for text-areas , don't escape HTML and put text in a box
     *
     * @param ctx
     * @param writer
     * @param text
     * @param style
     * @param code
     *
     * @throws IOException
     */
    public static void printTextArea(FacesContext ctx, ResponseWriter writer, String text, String style, boolean code) throws IOException {
        startTextArea(writer);
        printTextAreaText(ctx, writer, text, style, code);
        endTextArea(writer);
    }

    /**
     *
     * PrettyPrinter for text-areas , print content
     *
     * @param ctx
     * @param writer
     * @param text
     * @param style
     * @param code
     *
     * @throws IOException
     */
    public static void printTextAreaText(FacesContext ctx, ResponseWriter writer, String text, String style, boolean code) throws IOException {
        if (text == null || text.length() == 0) {
            text = TEXT_NOT_AVAILABLE;
            style += " " + CSS_CLASS_PROPERTY_VALUE_NA;
        }

        startDiv(writer, style);
        HtmlOutputText t = new HtmlOutputText();
        //t.setStyleClass(style);
        // Only escape source code
        t.setEscape(code);
        t.setValue(text);
        t.encodeAll(ctx);
        endDiv(writer);

    }

    /**
     * Start text area (i.e. a container for the text)
     *
     * @param writer
     *
     * @throws IOException
     */
    public static void startTextArea(ResponseWriter writer) throws IOException {
        /*if (text == null || text.length() == 0) {
         text = TEXT_NOT_AVAILABLE;
         style += " " + CSS_CLASS_PROPERTY_VALUE_NA;
         }*/
        startDiv(writer, CSS_CLASS_TEXT_CONTAINER);

        //startDiv(writer, style);
        startDiv(writer, "");
    }

    /**
     * end a text area container
     *
     * @param writer
     *
     * @throws IOException
     */
    public static void endTextArea(ResponseWriter writer) throws IOException {
        endDiv(writer);
        endDiv(writer);
        writer.write("\r\n");
    }

    /**
     * Print key/value map with title
     *
     * @param context
     * @param writer
     * @param properties
     * @param title
     *
     * @throws IOException
     */
    public static void printKeyValueMap(FacesContext context, ResponseWriter writer, Map<String, String> properties, String title) throws IOException {

        UIHelper.printText(context, writer, title, CSS_CLASS_VARIABLE_SUBTITLE);
        if (!properties.isEmpty()) {
            //writer.startElement("div", null);
            //writer.writeAttribute("class", CSS_CLASS_FOLDER, null);
            for (Map.Entry<String, String> entry : properties.entrySet()) {

                UIHelper.printProperty(context, writer, entry.getKey(), entry.getValue());
            }
            //writer.endElement("div");
        } else {
            printText(context, writer, "[Empty Set]", CSS_CLASS_PROPERTY_VALUE_NA + " " + CSS_CLASS_PROPERTY_VALUE);
        }
        writer.write("\r\n");
    }

    /**
     * Print key/value map w/o title
     * <p>
     * TODO TO avoid printing to much properties in player mode, shall we
     * introduce something like prefixing propertyName with something special
     * (e.g '$', '_' or '`') to make that property internal ?
     *
     * @param context
     * @param writer
     * @param properties
     *
     * @throws IOException
     */
    public static void printKeyValueMap(FacesContext context, ResponseWriter writer, Map<String, String> properties) throws IOException {
        if (!properties.isEmpty()) {
            for (Map.Entry<String, String> entry : properties.entrySet()) {
                UIHelper.printProperty(context, writer, entry.getKey(), entry.getValue());
            }
        } else {
            printText(context, writer, "[Empty Set]", CSS_CLASS_PROPERTY_VALUE_NA + " " + CSS_CLASS_PROPERTY_VALUE);
        }
        writer.write("\r\n");
    }

    /**
     * PrettyPrinter for e-mail like messages
     *
     * @param context
     * @param writer
     * @param destination
     * @param from
     * @param subject
     * @param date
     * @param body
     * @param token
     * @param attachments
     *
     * @throws IOException
     */
    public static void printMessage(FacesContext context, ResponseWriter writer,
            String destination, String from, String subject, String date, String body, String token,
            List<Attachment> attachments) throws IOException {

        UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_CONTAINER);
        //printText(context, writer, TEXT_SEND_MESSAGE, CSS_CLASS_MESSAGE_TITLE);
        UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_HEADER);
        UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_HEADER_FIRSTLINE);

        UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_FROM + CSS_CLASS_INLINE_DIV);
        //printText(context, writer, unescapeAndTrimQuotes(from), CSS_CLASS_PROPERTY_VALUE);
        UIHelper.printProperty(context, writer, UIHelper.TEXT_FROM, unescapeAndTrimQuotes(from));
        UIHelper.endDiv(writer);

        if (destination != null && destination.length() > 0) {
            UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_TO + CSS_CLASS_INLINE_DIV);
            UIHelper.printProperty(context, writer, UIHelper.TEXT_DESTINATION, unescapeAndTrimQuotes(destination));
            UIHelper.endDiv(writer);
        }

        if (date != null && !date.isEmpty()) {
            UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_DATE + CSS_CLASS_INLINE_DIV);
            UIHelper.printProperty(context, writer, UIHelper.TEXT_DATE, unescapeAndTrimQuotes(date));
            //printText(context, writer, unescapeAndTrimQuotes(date), CSS_CLASS_PROPERTY_VALUE);
            UIHelper.endDiv(writer);
        }

        UIHelper.endDiv(writer); // </div class="firstline">

        UIHelper.startDiv(writer, CSS_CLASS_MESSAGE_SUBJECT + CSS_CLASS_INLINE_DIV);
        //printText(context, writer, unescapeAndTrimQuotes(subject), CSS_CLASS_PROPERTY_VALUE);
        UIHelper.printProperty(context, writer, UIHelper.TEXT_SUBJECT, unescapeAndTrimQuotes(subject));
        UIHelper.endDiv(writer);

        UIHelper.endDiv(writer); // </div class="header">

        if (attachments != null && attachments.size() > 0) {
            for (Attachment a : attachments) {
                UIHelper.printProperty(context, writer, UIHelper.TEXT_ATTACHMENTS, a.getFile().translateOrEmpty((Player) null));
            }
        }

        UIHelper.printPropertyTextArea(context, writer, " ", unescapeAndTrimQuotes(body), false, true);

        UIHelper.endDiv(writer); // </div class="container">
    }
}
