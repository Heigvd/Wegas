/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.helper;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Script;
import java.io.IOException;
import java.util.Map;
import javax.faces.component.html.HtmlOutputText;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * @author maxence
 */
public class UIHelper {

    public static final String CSS_CLASS_COLUMN = "wegas-pdf-column";
    public static final String CSS_CLASS_COLUMNS = "wegas-pdf-columns";

    public static final String CSS_CLASS_CONTENT = "wegas-pdf-content";
    public static final String CSS_CLASS_ERROR = "wegas-pdf-error";
    public static final String CSS_CLASS_FOLDER = "wegas-pdf-folder";

    public static final String CSS_CLASS_MAIN_IMAGE = "wegas-pdf-title-image";
    public static final String CSS_CLASS_MAIN_TITLE = "wegas-pdf-title";

    public static final String CSS_CLASS_MENU = "wegas-pdf-menu";

    public static final String CSS_CLASS_PICTURE = "wegas-pdf-picture";
    public static final String CSS_CLASS_PICTURES = "wegas-pdf-pictures-collection";

    public static final String CSS_CLASS_PROPERTY = "wegas-pdf-property";
    public static final String CSS_CLASS_PROPERTY_KEY = "wegas-pdf-property-key";
    public static final String CSS_CLASS_PROPERTY_VALUE = "wegas-pdf-property-value";
    public static final String CSS_CLASS_PROPERTY_VALUE_NA = "wegas-pdf-property-value-na";
    public static final String CSS_CLASS_PROPERTY_VALUE_TEXTAREA = "wegas-pdf-property-value-textarea";

    public static final String CSS_CLASS_SOURCE_CODE = "wegas-pdf-code";

    public static final String CSS_CLASS_TEXT_CONTAINER = "wegas-pdf-text-container";

    public static final String CSS_CLASS_VARIABLE_CONTAINER = "wegas-pdf-variable-container";
    public static final String CSS_CLASS_VARIABLE_SUBTITLE = "wegas-pdf-variable-subtitle";
    public static final String CSS_CLASS_VARIABLE_TITLE = "wegas-pdf-variable-title";

    public static final String CSS_CLASS_INDENT_CODE = "wegas-pdf-indent-code";

    public static final String TEXT_ACTIVE_DEFAULT = "Active by default";
    public static final String TEXT_CONDITION = "Condition";
    public static final String TEXT_CONTENT = "Content";
    public static final String TEXT_DEFAULT_RESULT = "Default result";
    public static final String TEXT_DEFAULT_STATE = "Default State";
    public static final String TEXT_DESCRIPTION = "Description";
    public static final String TEXT_DURATION = "Duration";
    public static final String TEXT_ID = "ID";
    public static final String TEXT_IMPACT_SOURCECODE = "Impact";
    public static final String TEXT_IMPACT_TEXT = "Impact text";
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
    public static final String TEXT_MORAL = "Moral";
    public static final String TEXT_CONFIDENCE = "Confidence";
    public static final String TEXT_FROM = "From";
    public static final String TEXT_DESTINATION = "To";
    public static final String TEXT_SUBJECT = "Subject";
    public static final String TEXT_MESSAGE = "Message";

    public static String unescapeAndTrimQuotes(String st){
	return Helper.unescape(st).replaceAll("^\\s*\"|\"\\s*$", "");
    }
 
    /**
     * Start a div with the specigied CSS class.
     *
     * @see endDiv to end the div
     *
     * @param wr
     * @param cssClass
     * @throws IOException
     */
    public static void startDiv(ResponseWriter wr, String cssClass) throws IOException {
	startDiv(wr, cssClass, null);
    }

    /**
     * Start the specified element with specified Css Classes and id
     *
     * @see endElement for the closing tag
     *
     * @param wr
     * @param elem
     * @param cssClass
     * @param id
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
     * @throws IOException
     */
    public static void startDiv(ResponseWriter wr, String cssClass, String id) throws IOException {
	startElement(wr, "div", cssClass, id);
    }

    /**
     * end a div
     *
     * @param wr
     * @throws IOException
     */
    public static void endDiv(ResponseWriter wr) throws IOException {
	wr.endElement("div");
    }

    /**
     * start a span with the specified CSS classes
     *
     * @see endSpan
     * @param wr
     * @param cssClass
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
     * @throws IOException
     */
    public static void startSpan(ResponseWriter wr, String cssClass, String id) throws IOException {
	startElement(wr, "span", cssClass, id);
    }

    /**
     * end a span
     *
     * @param wr
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
     * @throws IOException
     */
    public static void printProperty(FacesContext ctx, ResponseWriter writer, String key, boolean value) throws IOException {
	printProperty(ctx, writer, key, (value ? "Yes" : "No"));
	writer.write("\r\n");
    }

    /**
     * Print a Integer property
     *
     * @param ctx
     * @param writer
     * @param key
     * @param value
     * @throws IOException
     */
    public static void printProperty(FacesContext ctx, ResponseWriter writer, String key, Integer value) throws IOException {
	printProperty(ctx, writer, key, (value == null ? TEXT_NOT_AVAILABLE : value.toString()));
    }

    /**
     * Print a Long property
     *
     * @param ctx
     * @param writer
     * @param key
     * @param value
     * @throws IOException
     */
    public static void printProperty(FacesContext ctx, ResponseWriter writer, String key, Long value) throws IOException {
	printProperty(ctx, writer, key, (value == null ? TEXT_NOT_AVAILABLE : value.toString()));
    }

    /**
     * Print a key/value property. Value as string
     *
     * @param ctx
     * @param writer
     * @param key
     * @param value
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
     * @param key the name
     * @param value the text to print
     * @param code add a css class if the text represents a source code
     * @throws IOException
     */
    public static void printPropertyTextArea(FacesContext ctx, ResponseWriter writer, String key, String value, boolean code) throws IOException {
	startDiv(writer, CSS_CLASS_PROPERTY);
	printText(ctx, writer, key, CSS_CLASS_PROPERTY_KEY);
	printTextArea(ctx, writer, value, CSS_CLASS_PROPERTY_VALUE_TEXTAREA + (code ? " " + CSS_CLASS_SOURCE_CODE : ""), code);
	endDiv(writer);
	writer.write("\r\n");
    }

    /**
     * Pretty printer for impact
     *
     * @param ctx
     * @param writer
     * @param key
     * @param script
     * @throws IOException
     */
    public static void printPropertyImpactScript(FacesContext ctx, ResponseWriter writer, String key, Script script) throws IOException {

	printText(ctx, writer, "IMPACT", CSS_CLASS_VARIABLE_TITLE);
	try {
	    if (script == null) {
		printPropertyScript(ctx, writer, key, script);
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
     * @throws IOException
     */
    public static void printText(FacesContext ctx, ResponseWriter writer, String text, String style) throws IOException {

	if (text == null || text.replace("\\s", "").length() == 0) {
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
     * @throws IOException
     */
    public static void printTextAreaText(FacesContext ctx, ResponseWriter writer, String text, String style, boolean code) throws IOException {
	if (text == null || text.length() == 0) {
	    text = TEXT_NOT_AVAILABLE;
	    style += " " + CSS_CLASS_PROPERTY_VALUE_NA;
	}
	HtmlOutputText t = new HtmlOutputText();
	t.setStyleClass(style);
	if (!code) {
	    t.setEscape(false);
	}
	t.setValue(text);
	t.encodeAll(ctx);
    }

    /**
     * Start text area (i.e. a container for the text)
     *
     * @param writer
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
     * @throws IOException
     */
    public static void printKeyValueMap(FacesContext context, ResponseWriter writer, Map<String, String> properties, String title) throws IOException {

	UIHelper.printText(context, writer, title, CSS_CLASS_VARIABLE_SUBTITLE);
	if (!properties.isEmpty()) {
	    //writer.startElement("div", null);
	    //writer.writeAttribute("class", CSS_CLASS_FOLDER, null);
	    for (String key : properties.keySet()) {
		UIHelper.printProperty(context, writer, key, properties.get(key));
	    }
	    //writer.endElement("div");
	} else {
	    printText(context, writer, "[Empty Set]", CSS_CLASS_PROPERTY_VALUE_NA + " " + CSS_CLASS_PROPERTY_VALUE);
	}
	writer.write("\r\n");
    }

    /**
     * Print key/value map w/o title
     *
     * @param context
     * @param writer
     * @param properties
     * @throws IOException
     */
    public static void printKeyValueMap(FacesContext context, ResponseWriter writer, Map<String, String> properties) throws IOException {
	if (!properties.isEmpty()) {
	    for (String key : properties.keySet()) {
		UIHelper.printProperty(context, writer, key, properties.get(key));
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
     * @param object
     * @param message
     * @throws IOException
     */
    public static void printMessage(FacesContext context, ResponseWriter writer,
	    String destination, String from,
	    String object, String message) throws IOException {


	UIHelper.startDiv(writer, CSS_CLASS_VARIABLE_CONTAINER);

	UIHelper.printProperty(context, writer, UIHelper.TEXT_FROM, unescapeAndTrimQuotes(from));
	UIHelper.printProperty(context, writer, UIHelper.TEXT_DESTINATION, unescapeAndTrimQuotes(destination));
	UIHelper.printProperty(context, writer, UIHelper.TEXT_SUBJECT, unescapeAndTrimQuotes(object));
	UIHelper.printPropertyTextArea(context, writer, UIHelper.TEXT_MESSAGE,  unescapeAndTrimQuotes(message), false);

	UIHelper.endDiv(writer);
    }

}
