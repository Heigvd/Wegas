/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pdf.helper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

/**
 *
 * @author maxence
 */
public class ImpactPrinter {

    private final String script;

    /**
     * 
     * @param script the script to print
     */
    public ImpactPrinter(String script){
	// Replace all new line by a semicolon 
	this.script = script.replaceAll("\r\n|\n", ";");
    }
    
    /**
     * 
     * @param script
     * @return 
     */
    private List<String> parse() {
	List<String> instructions;
	instructions = new ArrayList<>();

	boolean inQuotes = false;
	boolean escaped = false;
	StringBuilder b = new StringBuilder();
	for (char c : script.toCharArray()) {
	    switch (c) {
		case '{':
		case '}':
		    b.append(c);
		    if (!inQuotes) {
			instructions.add(b.toString());
			b = new StringBuilder();
		    }
		    break;
		case ';':
		    if (inQuotes) {
			b.append(c);
		    } else {
			instructions.add(b.toString());
			b = new StringBuilder();
		    }
		    break;
		case '\\':
		    escaped = true;
		    b.append(c);
		    break;
		case '\"':
		    if (!escaped) {
			inQuotes = !inQuotes;
		    }
		default:
		    b.append(c);
		    if (escaped) {
			escaped = false;
		    }
		    break;
	    }
	}
	instructions.add(b.toString());
	return instructions;
    }

    /**
     * Impact Pretty Printer
     * @param context
     * @param writer
     * @throws IOException 
     */
    public void print(FacesContext context, ResponseWriter writer) throws IOException {
	List<String> instructions;
	instructions = parse();
	//instructions = script.split("(?s)[;\n](?=(?:(?:.*?(?<!\\\\)\"){2})*[^\"]*$)");
	UIHelper.startTextArea(writer);
	for (String instruction : instructions) {
	    printInstruction(context, writer, instruction);
	}
	UIHelper.endTextArea(writer);
    }

    private void printInstruction(FacesContext context, ResponseWriter writer, String instruction) throws IOException {
	Pattern pattern;
	String str = instruction.trim();
	//pattern = Pattern.compile("VariableDescriptorFacade.find\\(gameModel, \"*)\"\\)\\.(.*)\\(self, *(.*)\\)");

	if (!str.isEmpty()) {
	    // Unndent block (Parser create a new instruction after either a "{" or a "}", btw such a char always stands just before $)
	    if (str.matches(".*\\}$")) {
		UIHelper.endDiv(writer);
	    }

	    pattern = Pattern.compile("(VariableDescriptorFacade|Variable)\\.find\\(gameModel, \"(.*)\"\\)\\.(.*)\\(self, *(.*)\\)");

	    Matcher matcher = pattern.matcher(str);

	    if (matcher.matches()) {
		if (matcher.matches()) {
		    //String group = matcher.group(0);
		    String variableAlias = matcher.group(2);
		    String operator = matcher.group(3);
		    String value = matcher.group(4);

		    /*
		     * Detect specific operation
		     */
		    if ("sendMessage".equals(operator)) { // e-mail like message
			String[] args;
			args = value.split("(?s)[,](?=(?:(?:.*?(?<!\\\\)\"){2})*[^\"]*$)"); // arg separation
			UIHelper.printMessage(context, writer, variableAlias, args[0], args[1], args[2]);
		    } else {
			String print = variableAlias + " " + operator + " " + value;
			UIHelper.printTextAreaText(context, writer, print, UIHelper.CSS_CLASS_PROPERTY_VALUE_TEXTAREA + " " + UIHelper.CSS_CLASS_SOURCE_CODE, true);
		    }
		}
	    } else {
		UIHelper.printTextAreaText(context, writer, instruction, UIHelper.CSS_CLASS_PROPERTY_VALUE_TEXTAREA + " " + UIHelper.CSS_CLASS_SOURCE_CODE, true);
	    }

	    // Indent block (Parser create a new instruction after a "{", btw such a char always stands just before $)
	    if (str.matches(".*\\{$")) {
		UIHelper.startDiv(writer, UIHelper.CSS_CLASS_INDENT_CODE);
	    } 
	}
    }
}
