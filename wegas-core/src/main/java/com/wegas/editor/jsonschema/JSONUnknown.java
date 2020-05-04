package com.wegas.editor.jsonschema;

public final class JSONUnknown extends JSONType {

    public JSONUnknown() {
        super(false);
    }
    
    @Override
    public String getType() {
        return null;
    }

}