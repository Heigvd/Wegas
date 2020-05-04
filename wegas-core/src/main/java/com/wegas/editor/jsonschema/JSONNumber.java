package com.wegas.editor.jsonschema;

public class JSONNumber extends JSONType {

    public JSONNumber(boolean nullable) {
        super(nullable);
    }

    @Override
    final public String getType() {
        return "number";
    }

}
