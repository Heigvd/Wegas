package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.net.URI;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public abstract class Actor implements IStatementObject {
    private String name;
    private String mbox;
    private String mbox_sha1sum;
    private URI openid;
    private Account account;
    private transient boolean inverseFunctionalPropertySet = false;

    public String getMbox() {
        return mbox;
    }

    public void setMbox(String mbox) {
        if (mbox != null) {
            if (this.inverseFunctionalPropertySet) {
                throw new IllegalArgumentException("Only one Inverse Functional Property can be set");
            }
            inverseFunctionalPropertySet = true;
        } else {
            inverseFunctionalPropertySet = false;
        }
        this.mbox = mbox;
    }

    public String getMbox_sha1sum() { // NOPMD
        return mbox_sha1sum;
    }

    public void setMbox_sha1sum(String mbox_sha1sum) { // NOPMD
        if (mbox_sha1sum != null) {
            if (this.inverseFunctionalPropertySet) {
                throw new IllegalArgumentException("Only one Inverse Functional Property can be set");
            }
            inverseFunctionalPropertySet = true;
        } else {
            inverseFunctionalPropertySet = false;
        }
        this.mbox_sha1sum = mbox_sha1sum;
    }

    public URI getOpenid() {
        return openid;
    }

    public void setOpenid(URI openid) {
        if (openid != null) {
            if (this.inverseFunctionalPropertySet) {
                throw new IllegalArgumentException("Only one Inverse Functional Property can be set");
            }
            inverseFunctionalPropertySet = true;
        } else {
            inverseFunctionalPropertySet = false;
        }
        this.openid = openid;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        if (account != null) {
            if (this.inverseFunctionalPropertySet) {
                throw new IllegalArgumentException("Only one Inverse Functional Property can be set");
            }
            inverseFunctionalPropertySet = true;
        } else {
            inverseFunctionalPropertySet = false;
        }
        this.account = account;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public abstract String getObjectType();

    public JsonElement serialize() {
        return new JsonObject();
    }

    public String toString() {
        return "";
    }
}