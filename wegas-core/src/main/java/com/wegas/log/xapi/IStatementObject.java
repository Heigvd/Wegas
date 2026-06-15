package com.wegas.log.xapi;

import com.google.gson.JsonElement;

/*
* Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
* This file must be kept here so that any scenario script that would be based on it can run safely.
*/

public interface IStatementObject {
    public String getObjectType();

    public JsonElement serialize();
}
