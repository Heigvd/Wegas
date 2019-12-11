/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.SelectView.FreeForAllSelector;
import com.wegas.editor.View.StringView;
import java.io.Serializable;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Embeddable
@JsonIgnoreProperties(value = {"imageUri"})
public class GameModelProperties implements Serializable, Mergeable {

    @WegasExtraProperty(
            nullable = false,
            view = @View(
                    label = "RefID",
                    readOnly = true,
                    value = StringView.class,
                    index = -800
            )
    )
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
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = False.class,
            view = @View(label = "Game is played", value = FreeForAllSelector.class))
    private Boolean freeForAll = false;
    /**
     *
     */
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = False.class,
            view = @View(label = "Guest allowed?"))
    private Boolean guestAllowed = false;
    /**
     *
     */
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Pages URI"))
    private String pagesUri = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Stylesheets URI"))
    private String cssUri = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Websockets", value = Hidden.class))
    private String websocket = "";

    /**
     *
     */
    //@JsonView({Views.ExtendedI.class})
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Log ID"))
    private String logID = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "ServerSripts URI"))
    private String scriptUri = "";

    /**
     *
     */
    @JsonView({Views.ExtendedI.class, Views.LobbyI.class})
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "ClientSripts URI"))
    private String clientScriptUri = "";
    /**
     *
     */
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(label = "Icon"))
    private String iconUri = "";

    /**
     *
     */
    public GameModelProperties() {
    }

    /**
     * Is a guest allowed to create/join a team on this gameModel ?
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

    @Override
    public <T extends Mergeable> T getMergeableParent() {
        return null;
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }

}
