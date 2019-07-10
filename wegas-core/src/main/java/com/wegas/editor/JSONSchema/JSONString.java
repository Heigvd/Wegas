package com.wegas.editor.JSONSchema;

public class JSONString extends JSONType {

    public JSONString(boolean nullable) {
        super(nullable);
    }

    @Override
    final public String getType() {
        return "string";
    }
}