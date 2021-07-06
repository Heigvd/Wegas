
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@Table(indexes = {
    @Index(columnList = "gamemodel_id"),
    @Index(columnList = "gamemodel_id, libraryType, contentKey", unique = true)
})
public class GameModelContent extends AbstractEntity implements Serializable, ModelScoped, NamedEntity {

    public static final String CSS = "CSS";
    public static final String SERVER_SCRIPT = "ServerScript";
    public static final String CLIENT_SCRIPT = "ClientScript";

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @NotNull
    @ManyToOne
    @JsonIgnore
    private GameModel gameModel;

    @NotBlank
    @JsonView(Views.ExportI.class)
    @WegasEntityProperty(
        notSerialized = true,
        optional = false, nullable = false, proposal = EmptyString.class, ignoreNull = true,
        view = @View(label = "Key", readOnly = true, value = StringView.class))
    private String contentKey;

    /**
     * Library type. Kind of parent folder name
     */
    @NotBlank
    @JsonView(Views.ExportI.class)
    @WegasEntityProperty(
        notSerialized = true,
        optional = false, nullable = false, proposal = EmptyString.class, ignoreNull = true,
        view  = @View(label = "Library Type", readOnly = true, value = StringView.class)
    )
    private String libraryType;

    /**
     * MIME type. This is not the same as the library type. For instance one may define a
     * type:ClientScript library with aa application/javascript MIME type and another ClientScript
     * with application/typescript mimetype.
     */
    @NotBlank
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyString.class, ignoreNull = true,
        view = @View(label = "MIME Type", readOnly = true, value = StringView.class))
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
    public GameModelContent(String key, String content, String contentType, String libraryType) {
        this.contentKey = key;
        this.content = content;
        this.contentType = contentType;
        this.libraryType = libraryType;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 29 * hash + Objects.hashCode(this.id);
        hash = 29 * hash + Objects.hashCode(gameModel);
        hash = 29 * hash + Objects.hashCode(contentType);
        hash = 29 * hash + Objects.hashCode(libraryType);
        hash = 29 * hash + Objects.hashCode(this.contentKey);
        return hash;
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
        if (!Objects.equals(this.gameModel, other.gameModel)) {
            return false;
        }
        if (!Objects.equals(this.libraryType, other.libraryType)) {
            return false;
        }
        if (!Objects.equals(this.contentType, other.contentType)) {
            return false;
        }
        return true;
    }

    @JsonIgnore
    public GameModel getGameModel() {
        return gameModel;
    }

    @JsonIgnore
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
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

    public String getLibraryType() {
        return libraryType;
    }

    public void setLibraryType(String libraryType) {
        this.libraryType = libraryType;
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

    /**
     * @return the id
     */
    @Override
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
