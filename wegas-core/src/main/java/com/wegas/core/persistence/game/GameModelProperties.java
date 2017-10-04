/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.rest.util.Views;
import java.io.Serializable;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.Mergeable;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Embeddable
public class GameModelProperties implements Serializable, Mergeable {

    @Override
    public String getRefId() {
        return "GameModelProperties";
    }

    @Override
    public void setRefId(String refId) {
    }
    
    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @WegasEntityProperty
    private Boolean freeForAll = false;
    /**
     *
     */
    @WegasEntityProperty
    private Boolean guestAllowed = false;
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    @WegasEntityProperty
    private String pagesUri = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    @WegasEntityProperty
    private String cssUri = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    @WegasEntityProperty
    private String websocket = "";

    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    @WegasEntityProperty
    private String logID = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    @WegasEntityProperty
    private String scriptUri = "";

    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    @WegasEntityProperty
    private String clientScriptUri = "";
    /**
     *
     */
    @WegasEntityProperty
    private String imageUri = "";
    /**
     *
     */
    @WegasEntityProperty
    private String iconUri = "";

    /**
     *
     */
    public GameModelProperties() {
    }

    /**
     *
     * @return whether or not a guest is allowed to create or join a team within this gameModel
     */
    public Boolean getGuestAllowed() {
        return guestAllowed;
    }

    /*
     * Allow or forbid guest to create or join team
     *
     * @param guestAllowed is a guest allowed to create or join a team ?
     */
    public void setGuestAllowed(Boolean guestAllowed) {
        this.guestAllowed = guestAllowed;
    }

    /**
     * Is the game designed to be played individually (freeForAll = true) or played as a team (freeForAll =false)
     * "FreeForAll" iz bad wording...
     *
     * @return the freeForAll true if the game is designed to be played alone
     */
    public Boolean getFreeForAll() {
        return freeForAll;
    }

    /**
     * @param freeForAll the freeForAll to set
     */
    public void setFreeForAll(Boolean freeForAll) {
        this.freeForAll = freeForAll;
    }

    /**
     * @return the pagesUri
     */
    public String getPagesUri() {
        return pagesUri;
    }

    /**
     * @param pagesUri the pagesUri to set
     */
    public void setPagesUri(String pagesUri) {
        this.pagesUri = pagesUri;
    }

    /**
     * @return the cssUri
     */
    public String getCssUri() {
        return cssUri;
    }

    /**
     * @param cssUri the cssUri to set
     */
    public void setCssUri(String cssUri) {
        this.cssUri = cssUri;
    }

    /**
     * @return the websocket
     */
    public String getWebsocket() {
        return websocket;
    }

    /**
     * @param websocket the websocket to set
     */
    public void setWebsocket(String websocket) {
        this.websocket = websocket;
    }

    /**
     *
     * @return logID
     */
    public String getLogID() {
        return logID;
    }

    /**
     *
     * @param logID logID to set
     */
    public void setLogID(String logID) {
        this.logID = logID;
    }

    /**
     *
     * @return static server script URI
     */
    public String getScriptUri() {
        return scriptUri;
    }

    /**
     *
     * @param scriptUri
     */
    public void setScriptUri(String scriptUri) {
        this.scriptUri = scriptUri;
    }

    /**
     * @return the imageUri
     */
    public String getImageUri() {
        return imageUri;
    }

    /**
     * @param imageUri the imageUri to set
     */
    public void setImageUri(String imageUri) {
        this.imageUri = imageUri;
    }

    /**
     * @return the iconUri
     */
    public String getIconUri() {
        return iconUri;
    }

    /**
     * @param iconUri the iconUri to set
     */
    public void setIconUri(String iconUri) {
        this.iconUri = iconUri;
    }

    /**
     * @return the clientScriptUri
     */
    public String getClientScriptUri() {
        return clientScriptUri;
    }

    /**
     * @param clientScriptUri the clientScriptUri to set
     */
    public void setClientScriptUri(String clientScriptUri) {
        this.clientScriptUri = clientScriptUri;
    }

}
