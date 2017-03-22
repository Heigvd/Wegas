package com.wegas.core.security.aai;

import com.wegas.core.Helper;

/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * This class is for exchanging configuration data taken from *.properties files
 *
 * Copyright (c) AlbaSim, School of Business and Engineering of Western Switzerland
 * Licensed under the MIT License
 * Created by jarle.hulaas@heig-vd.ch on 22.03.2017.
 */

public class AaiConfigInfo {

    private static boolean aaiEnabled;
    private static boolean showButton;
    private static String secret; // Do not export this one !
    private static String server;
    private static String loginUrl;

    static {

        server = Helper.getWegasProperty("aai.server").trim();
        secret = Helper.getWegasProperty("aai.secret").trim();
        aaiEnabled = Helper.getWegasProperty("aai.enabled").trim().toLowerCase().equals("true");
        loginUrl = Helper.getWegasProperty("aai.loginurl").trim().toLowerCase();
        showButton = Helper.getWegasProperty("aai.showbutton").trim().toLowerCase().equals("true");

    }

    public AaiConfigInfo(){

    }

    public static void setAaiEnabled(boolean aaiEnabled) {
        AaiConfigInfo.aaiEnabled = aaiEnabled;
    }

    public static boolean isAaiEnabled() {
        return aaiEnabled;
    }

    public static void setShowButton(boolean showButton) {
        AaiConfigInfo.showButton = showButton;
    }

    public static boolean isShowButton() {
        return showButton;
    }

    public static void setSecret(String secret) {
        AaiConfigInfo.secret = secret;
    }

    public static String getSecret() {
        return secret;
    }

    public static void setServer(String server) {
        AaiConfigInfo.server = server;
    }

    public static String getServer() {
        return server;
    }

    public static void setLoginUrl(String loginUrl) {
        AaiConfigInfo.loginUrl = loginUrl;
    }

    public static String getLoginUrl() {
        return loginUrl;
    }

}
