package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.net.URI;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Attachment {
    private final static char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();
    private URI usageType;                            //required
    private HashMap<String, String> display;        //required
    private HashMap<String, String> description;    //optional
    private String contentType;                        //required
    private int length;                                //required
    private String sha2;                            //required
    private URI fileUrl;                            //optional

    private static String bytesToHex(byte[] bytes) {
        return "";
    }

    public static String generateSha2(byte[] bytes) throws NoSuchAlgorithmException {
        return "";
    }

    public byte[] addAttachment(String attachmentInput, String contentTypeInput) throws NoSuchAlgorithmException, IOException {
        return new byte[1];
    }

    public URI getUsageType() {
        return usageType;
    }

    public void setUsageType(URI usageType) {
        this.usageType = usageType;
    }

    public HashMap<String, String> getDisplay() {
        return display;
    }

    public void setDisplay(HashMap<String, String> display) {
        this.display = display;
    }

    public HashMap<String, String> getDescription() {
        return description;
    }

    public void setDescription(HashMap<String, String> description) {
        this.description = description;
    }

    public String getContentType() {
        return contentType;
    }

    public int getLength() {
        return length;
    }

    public String getSha2() {
        return sha2;
    }

    public URI getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(URI fileUrl) {
        this.fileUrl = fileUrl;
    }

    private JsonElement serializeHash(HashMap<String, String> map) {
        return new JsonObject();
    }

    public JsonElement serialize() {
        return new JsonObject();
    }
}
