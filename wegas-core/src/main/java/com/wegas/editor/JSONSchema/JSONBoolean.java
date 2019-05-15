package com.wegas.editor.JSONSchema;

public class JSONBoolean extends JSONType {

    public JSONBoolean(boolean nullable) {
        super(nullable);
    }

    @Override
    final public String getType() {
        return "boolean";
    }

}
