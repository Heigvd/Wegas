/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;

/**
 * @author jarle.hulaas@heig-vd.ch on 22.03.2017.
 */
public final class AaiConfigInfo {
    /**
     * EDU-ID login url
     */
    private String eduIdUrl;

    /**
     * Should show button on login page or not
     */
    private boolean eduIdEnabled;

    private static volatile AaiConfigInfo instance = null;

    private AaiConfigInfo() {
        eduIdEnabled = Helper.getWegasProperty("eduid.enabled", "false").trim().toLowerCase().equals("true");
        eduIdUrl = Helper.getWegasProperty("eduid.url", "").trim();
    }

    private synchronized static void setInstance() {
        if (AaiConfigInfo.instance == null) {
            AaiConfigInfo.instance = new AaiConfigInfo();
        }
    }

    public static AaiConfigInfo getInstance() {
        if (AaiConfigInfo.instance == null) {
            setInstance();
        }
        return AaiConfigInfo.instance;
    }

    /**
     * Get the value of eduIdUrl
     *
     * @return the value of eduIdUrl
     */
    public String getEduIdUrl() {
        return eduIdUrl;
    }

    /**
     * Set the value of eduIdUrl
     *
     * @param eduIdUrl new value of eduIdUrl
     */
    public void setEduIdUrl(String eduIdUrl) {
        this.eduIdUrl = eduIdUrl;
    }

    /**
     * Get the value of eduIdEnabled
     *
     * @return the value of eduIdEnabled
     */
    public boolean isEduIdEnabled() {
        return eduIdEnabled;
    }

    /**
     * Set the value of eduIdEnabled
     *
     * @param eduIdEnabled new value of eduIdEnabled
     */
    public void setEduIdEnabled(boolean eduIdEnabled) {
        this.eduIdEnabled = eduIdEnabled;
    }

}
