package com.wegas.editor.jsonschema;

public class JSONBoolean extends JSONType {

    public JSONBoolean(boolean nullable) {
        super(nullable);
    }

    @Override
    final public String getType() {
        return "boolean";
    }

}
