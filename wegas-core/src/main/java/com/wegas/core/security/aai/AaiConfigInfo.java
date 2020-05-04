/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;

/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * This singleton class is for exporting configuration data taken from *.properties files
 *
 * Copyright (c) AlbaSim, School of Business and Engineering of Western Switzerland
 * Licensed under the MIT License
 * Created by jarle.hulaas@heig-vd.ch on 22.03.2017.
 */

public final class AaiConfigInfo {

    private boolean enabled;
    private boolean showButton;
    private String server;
    private String loginUrl;
    @JsonIgnore
    private String secret; // Do not export this one !

    private static volatile AaiConfigInfo instance = null;

    private AaiConfigInfo(){
        server = Helper.getWegasProperty("aai.server").trim();
        secret = Helper.getWegasProperty("aai.secret").trim();
        enabled = Helper.getWegasProperty("aai.enabled").trim().toLowerCase().equals("true");
        loginUrl = Helper.getWegasProperty("aai.loginurl").trim();
        showButton = Helper.getWegasProperty("aai.showbutton").trim().toLowerCase().equals("true");
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

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public static boolean isAaiEnabled() {
        return getInstance().enabled;
    }

    public void setShowButton(boolean showButton) {
        this.showButton = showButton;
    }

    public boolean isShowButton() {
        return showButton;
    }

    public static boolean isAaiShowButton() {
        return getInstance().showButton;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getSecret() {
        return secret;
    }

    public static String getAaiSecret() {
        return getInstance().secret;
    }

    public void setServer(String server) {
        this.server = server;
    }

    public String getServer() {
        return server;
    }

    public static String getAaiServer() {
        return getInstance().server;
    }

    public void setLoginUrl(String loginUrl) {
        this.loginUrl = loginUrl;
    }

    public String getLoginUrl() {
        return loginUrl;
    }

    public static String getAaiLoginUrl() {
        return getInstance().loginUrl;
    }
}
