/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
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
 * Impact Pretty Printer
 *
 * @author maxence
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class ImpactPrinter {

    private final String script;

    /**
     *
     * @param script the script to print
     */
    public ImpactPrinter(String script) {
        // Replace all new line by a semicolon  and ensure there is a ";" at the end
        this.script = script.replaceAll("\r\n|\n|\r", ";") + ";";
    }

    /**
     * split the script into instructions
     * <p>
     * ;, { and }
     *
     * @param script
     *
     * @return instructions list
     */
    private List<String> parse() {
        List<String> instructions;
        instructions = new ArrayList<>();

        // first char is never quoted nor escaped
        boolean inQuotes = false;
        boolean escaped = false;

        StringBuilder b = new StringBuilder();
        for (char c : script.toCharArray()) {
            switch (c) {
                case '{':
                case '}':
                case ';':
                    b.append(c);
                    if (!inQuotes) {
                        instructions.add(b.toString());
                        b = new StringBuilder();
                    }
                    break;
                case '\"': // detect unescaped quote
                    if (!escaped) {
                        inQuotes = !inQuotes;
                    }
                default:
                    b.append(c);
                    break;
            }
            // if current char is '\' mark next char escaped (unless the '\' itself is escaped)
            escaped = !escaped && c == '\\';
        }
        instructions.add(b.toString());
        return instructions;
    }

    /**
     * Impact Pretty Printer
     *
     * @param context
     * @param writer
     *
     * @throws IOException
     */
    public void print(FacesContext context, ResponseWriter writer) throws IOException {

        List<String> instructions;
        instructions = parse();
        //instructions = script.split("(?s)[;\n](?=(?:(?:.*?(?<!\\\\)\"){2})*[^\"]*$)");
        UIHelper.startTextArea(writer);
        for (String instruction : instructions) {
            // Avoid printg empty lines (i.e simple parser scrap...)
            if (!instruction.matches("^\\s*[;]\\s*$")) {
                printInstruction(context, writer, instruction);
            }
        }
        UIHelper.endTextArea(writer);
    }

    /**
     * Instruction pretty printer. Will try to detect common instruction pattern
     * such Variable.find(x).add(5)
     *
     * @param context
     * @param writer
     * @param instruction
     *
     * @throws IOException
     */
    private void printInstruction(FacesContext context, ResponseWriter writer, String instruction) throws IOException {
        Pattern pattern;
        String str = instruction.trim();
        //pattern = Pattern.compile("VariableDescriptorFacade.find\\(gameModel, \"*)\"\\)\\.(.*)\\(self, *(.*)\\)");

        if (!str.isEmpty()) {
            // Unndent block (Parser create a new instruction after either a "{" or a "}", btw such a char always stands just before $)
            if (str.matches(".*\\}$")) {
                UIHelper.endDiv(writer);
            }

            //pattern = Pattern.compile("(VariableDescriptorFacade|Variable)\\.find\\(gameModel, \"(.*)\"\\)\\.(.*)\\(self, *(.*)\\).*;$");
            pattern = Pattern.compile("(?:(?:(?:VariableDescriptorFacade|Variable)\\.find\\(gameModel, \"(.*)\"\\))|(.*))\\.(.*)\\((?:self, )* *(.*)\\).*;$");

            Matcher matcher = pattern.matcher(str);

            if (matcher.matches()) {
                //String group = matcher.group(0);
                String variableAlias = matcher.group(1);
                //String shortcut = matcher.group(2);
                String operator = matcher.group(3);
                String value = matcher.group(4);

                /*
                     * Detect specific operation
                 */
                if ("sendMessage".equals(operator)) { // e-mail like message
                    String[] args;
                    args = value.split("(?s)[,](?=(?:(?:.*?(?<!\\\\)\"){2})*[^\"]*$)"); // arg separation
                    switch (args.length) {
                        case 3:
                            //                                     TO             FROM     SUBJECT  DATE  BODY,    TOKEN, ATTACHMENTS
                            UIHelper.printMessage(context, writer, variableAlias, args[0], args[1], null, args[2], null, null);
                            break;
                        case 4:
                            //                                     TO             FROM     SUBJECT  DATE  BODY,    TOKEN, ATTACHMENTS
                            UIHelper.printMessage(context, writer, variableAlias, args[0], args[1], null, args[2], null, null);
                            break;
                        default:
                            //                                     TO             FROM     SUBJECT  DATE  BODY,    TOKEN, ATTACHMENTS
                            UIHelper.printMessage(context, writer, variableAlias, args[0], args[2], args[1], args[3], args[4], null);
                            break;
                    }
                } else if ("sendMessageWithToken".equals(operator)) { // dated e-mail like message
                    String[] args;
                    args = value.split("(?s)[,](?=(?:(?:.*?(?<!\\\\)\"){2})*[^\"]*$)"); // arg separation
                    UIHelper.printMessage(context, writer, variableAlias, args[0], args[1], null, args[2], args[4], null);
                    //                                      TO           FROM     SUBJECT  DATE    BODY
                } else if ("sendDatedMessage".equals(operator)) { // dated e-mail like message
                    String[] args;
                    args = value.split("(?"
                            + "s)[,](?=(?:(?:.*?(?<!\\\\)\"){2})*[^\"]*$)"); // arg separation
                    switch (args.length) {
                        case 5:
                            //                                     TO             FROM     SUBJECT  DATE  BODY,    TOKEN, ATTACHMENTS
                            UIHelper.printMessage(context, writer, variableAlias, args[0], args[2], args[1], args[3], null, null);
                            break;
                        default:
                            //                                     TO             FROM     SUBJECT  DATE  BODY,    TOKEN, ATTACHMENTS
                            UIHelper.printMessage(context, writer, variableAlias, args[0], args[2], args[1], args[3], null, null);
                    }
                } else {
                    String var = variableAlias;
                    String op;
                    switch (operator) {
                        case "add":
                            op = "+";
                            var = variableAlias + " = " + variableAlias;
                            break;
                        case "sub":
                            op = "-";
                            var = variableAlias + " = " + variableAlias;
                            break;
                        case "set":
                            op = "=";
                            break;
                        default:
                            op = operator;
                            break;
                    }
                    String print = var + " " + op + " " + value;
                    UIHelper.printTextAreaText(context, writer, print, UIHelper.CSS_CLASS_PROPERTY_VALUE_TEXTAREA + " " + UIHelper.CSS_CLASS_SOURCE_CODE, true);
                }
            } else {
                UIHelper.printTextAreaText(context, writer, instruction, UIHelper.CSS_CLASS_PROPERTY_VALUE_TEXTAREA + " " + UIHelper.CSS_CLASS_SOURCE_CODE, true);
            }

            // Indent block (Parser create a new instruction after a "{", implying such a char always stands just before $)
            if (str.matches(".*\\{$")) {
                UIHelper.startDiv(writer, UIHelper.CSS_CLASS_INDENT_CODE);
            }
        }
    }
}
