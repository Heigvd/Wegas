/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;

import com.oracle.js.parser.ErrorManager;
import com.oracle.js.parser.Parser;
import com.oracle.js.parser.ScriptEnvironment;
import com.oracle.js.parser.ir.Block;
import com.oracle.js.parser.ir.Expression;
import com.oracle.js.parser.ir.LiteralNode;
import com.oracle.js.parser.ir.ObjectNode;
import com.oracle.js.parser.ir.PropertyNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.graalvm.polyglot.Value;

public class JSTool {

    private JSTool() {
        // private constructor prevents initialisation
    }

    /**
     * Convert code in String form to it's AST from. Graal's AST
     *
     * @param code source
     *
     * @return AST
     */
    public static Block parse(String code) {
        com.oracle.js.parser.Source source = com.oracle.js.parser.Source.sourceFor("myScript", code);

        ScriptEnvironment env = ScriptEnvironment.builder()
            .ecmaScriptVersion(2021)
            .strict(true).build();
        Parser p = new Parser(env, source, new ErrorManager.ThrowErrorManager());
        return p.parse().getBody();
    }

    /**
     * Extract properties from an ObjectLiteratlTree.
     *
     * @param node object AST to process
     *
     * @return properties mapped with their key
     */
    public static Map<String, Expression> mapProperties(ObjectNode node) {
        List<PropertyNode> properties = node.getElements();
        Map<String, Expression> map = new HashMap<>();

        for (PropertyNode property : properties) {
            String key = property.getKeyName();
            if (key != null) {
                map.put(key, property.getValue());
            }
        }
        return map;
    }

    /**
     * Get the given property of the given object.
     *
     * @param node object AST
     * @param key  property name
     *
     * @return the property tree which match the key or null
     */
    public static PropertyNode getProperty(ObjectNode node, String key) {
        if (key != null) {
            for (PropertyNode p : node.getElements()) {
                if (key.equals(p.getKeyName())) {
                    return p;
                }
            }
        }
        return null;
    }

    public static List<Value> unwrapList(Value value) {
        List<Value> list = new ArrayList<>();
        long l = value.getArraySize();
        for (long i = 0; i < l; i++) {
            list.add(value.getArrayElement(i));
        }
        return list;
    }

    public static Object unwrap(Value value) {
        if (value.isBoolean()) {
            return value.asBoolean();
        } else if (value.isHostObject()) {
            return value.asHostObject();
        } else if (value.isNativePointer()) {
            return value.asNativePointer();
        } else if (value.isNull()) {
            return null;
        } else if (value.isNumber()) {
            return value.asDouble();
        } else if (value.isProxyObject()) {
            return value.asProxyObject();
        } else if (value.isString()) {
            return value.asString();
        } else if (value.isDate()) {
            return value.asDate();
        } else if (value.isDuration()) {
            return value.asDuration();
        } else if (value.isInstant()) {
            return value.asInstant();
        } else if (value.isTime()) {
            return value.asTime();
        } else {
            return value;
        }
    }


    /**
     * Read tree as StringLiteral or return null.
     *
     * @param node the AST expression
     *
     * @return the string value or null
     */
    public static String readStringLiteral(Expression node) {
        if (node instanceof LiteralNode) {
            if (((LiteralNode) node).isString()) {
                return ((LiteralNode) node).getString();
            }
        }
        return null;
    }
}