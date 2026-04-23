package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class StatementReference implements IStatementObject {
    public static final String STATEMENT_REFERENCE = "StatementRef";
    private String id;

    public StatementReference() {
    }

    public StatementReference(String id) {
        this.id = id;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }

    public String getObjectType() {
        return STATEMENT_REFERENCE;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
