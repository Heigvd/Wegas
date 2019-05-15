package com.wegas.editor.JSONSchema;

public final class JSONUnknown extends JSONType {

    public JSONUnknown() {
        super(false);
    }
    
    @Override
    public String getType() {
        return null;
    }

}