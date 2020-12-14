/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.StringView;
import com.wegas.editor.view.VisibilitySelectView;
import java.io.Serializable;
import java.util.Collection;
import java.util.Objects;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Version;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@Table(indexes = {
    @Index(columnList = "clientscriptlibrary_gamemodel_id"),
    @Index(columnList = "scriptlibrary_gamemodel_id"),
    @Index(columnList = "csslibrary_gamemodel_id"),
    @Index(columnList = "csslibrary_gamemodel_id, scriptlibrary_gamemodel_id, clientscriptlibrary_gamemodel_id, contentKey", unique = true)
})
public class GameModelContent extends AbstractEntity implements Serializable, ModelScoped, NamedEntity {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JsonIgnore
    private GameModel csslibrary_GameModel; // NOPMD : field name in db

    @ManyToOne
    @JsonIgnore
    private GameModel scriptlibrary_GameModel; // NOPMD : field name in db

    @ManyToOne
    @JsonIgnore
    private GameModel clientscriptlibrary_GameModel; // NOPMD : field name in db

    @WegasEntityProperty(
        nullable = false,
        view = @View(label = "Key", readOnly = true, value = StringView.class))
    private String contentKey;

    /**
     *
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyString.class,
        view = @View(label = "Content Type", readOnly = true, value = StringView.class))
    private String contentType;
    /**
     *
     */
    @Lob
    @Basic(optional = false, fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    //@Column(columnDefinition = "text")
    //@JsonView({Views.Export.class})
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyString.class,
        view = @View(label = "Content", value = Hidden.class))
    private String content = "";

    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'PRIVATE'::character varying")
    @WegasEntityProperty(protectionLevel = ProtectionLevel.ALL,
        nullable = false,
        view = @View(
            label = "Visibility",
            value = VisibilitySelectView.class
        ))
    private Visibility visibility = Visibility.PRIVATE;

    @Version
    @WegasEntityProperty(nullable = false, optional = false, proposal = Zero.class,
        sameEntityOnly = true, view = @View(
            label = "Version",
            readOnly = true,
            value = NumberView.class,
            featureLevel = ADVANCED
        )
    )
    @Column(columnDefinition = "bigint default '0'::bigint")
    private Long version;

    /**
     *
     */
    public GameModelContent() {
        // ensure there is a default constructor
    }

    /**
     *
     * @param key
     * @param content
     * @param contentType
     */
    public GameModelContent(String key, String content, String contentType) {
        this.contentKey = key;
        this.content = content;
        this.contentType = contentType;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final GameModelContent other = (GameModelContent) obj;
        if (!Objects.equals(this.contentKey, other.contentKey)) {
            return false;
        }
        if (!Objects.equals(this.id, other.id)) {
            return false;
        }
        if (!Objects.equals(this.csslibrary_GameModel, other.csslibrary_GameModel)) {
            return false;
        }
        if (!Objects.equals(this.scriptlibrary_GameModel, other.scriptlibrary_GameModel)) {
            return false;
        }
        if (!Objects.equals(this.clientscriptlibrary_GameModel, other.clientscriptlibrary_GameModel)) {
            return false;
        }
        return true;
    }

    @JsonIgnore
    public GameModel getClientscriptlibrary_GameModel() { // NOPMD : field name in db
        return clientscriptlibrary_GameModel;
    }

    @JsonIgnore
    public void setClientscriptlibrary_GameModel(GameModel clientscriptlibrary_GameModel) { // NOPMD : field name in db
        this.clientscriptlibrary_GameModel = clientscriptlibrary_GameModel;
    }

    /**
     * @return the contentType
     */
    public String getContentType() {
        return contentType;
    }

    /**
     * @param contentType the contentType to set
     */
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    /**
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }

    @JsonIgnore
    public GameModel getCsslibrary_GameModel() { // NOPMD: field name in db
        return csslibrary_GameModel;
    }

    @JsonIgnore
    public void setCsslibrary_GameModel(GameModel csslibrary_GameModel) { // NOPMD: field name in db
        this.csslibrary_GameModel = csslibrary_GameModel;
    }

    /**
     * @return the id
     */
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    @JsonIgnore
    public String getContentKey() {
        return contentKey;
    }

    @JsonIgnore
    public void setContentKey(String contentKey) {
        this.contentKey = contentKey;
    }

    @JsonIgnore
    public String getLibraryType() {
        if (this.clientscriptlibrary_GameModel != null) {
            return "ClientScript";
        } else if (this.scriptlibrary_GameModel != null) {
            return "ServerScript";
        } else {
            return "CSS";
        }
    }

    @Override
    @JsonIgnore
    public String getName() {
        return this.getContentKey();
    }

    @Override
    @JsonIgnore
    public void setName(String name) {
        // no implementation
    }

    @JsonIgnore
    public GameModel getScriptlibrary_GameModel() { // NOPMD: field name in db
        return scriptlibrary_GameModel;
    }

    @JsonIgnore
    public void setScriptlibrary_GameModel(GameModel scriptlibrary_GameModel) { // NOPMD: field name in db
        this.scriptlibrary_GameModel = scriptlibrary_GameModel;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public Visibility getVisibility() {
        return this.visibility;
    }

    @Override
    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
    }

    @JsonIgnore
    public GameModel getGameModel() {
        if (this.clientscriptlibrary_GameModel != null) {
            return clientscriptlibrary_GameModel;
        } else if (this.scriptlibrary_GameModel != null) {
            return scriptlibrary_GameModel;
        } else {
            return csslibrary_GameModel;
        }
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 29 * hash + Objects.hashCode(this.id);
        hash = 29 * hash + Objects.hashCode(csslibrary_GameModel);
        hash = 29 * hash + Objects.hashCode(scriptlibrary_GameModel);
        hash = 29 * hash + Objects.hashCode(clientscriptlibrary_GameModel);
        hash = 29 * hash + Objects.hashCode(this.contentKey);
        return hash;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getGameModel().getRequieredReadPermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getGameModel().getRequieredUpdatePermission(context);
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getGameModel();
    }
}
