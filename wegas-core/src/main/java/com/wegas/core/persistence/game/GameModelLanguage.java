/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.Orderable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.view.StringView;
import com.wegas.editor.view.VisibilitySelectView;
import java.util.Collection;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;

/**
 * One could simply use a List of String annotated with @OrderColumn, but such a setup leads to incredible
 * cache coordination bug (please re test with EE8)
 *
 * @author maxence
 *
 */
@Entity
@Table(
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"gamemodel_id", "code"})
        },
        indexes = {
            @Index(columnList = "gamemodel_id")
        }
)
public class GameModelLanguage extends AbstractEntity implements Orderable, NamedEntity, ModelScoped {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView({Views.IndexI.class, Views.LobbyI.class})
    private Long id;

    /**
     * short name like en, en_uk, or fr_ch
     */
    @Column(length = 16, columnDefinition = "character varying(16) default ''::character varying")
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(
                    label = "Language code",
                    readOnly = true,
                    value = StringView.class
            ))
    private String code;

    @JsonIgnore
    @Transient
    private String refName;

    /**
     * Language name to display
     */
    @WegasEntityProperty(optional = false, nullable = false,
            view = @View(
            label = "Language name"
    ))
    private String lang;

    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'PRIVATE'::character varying")
    @WegasEntityProperty(protectionLevel = ProtectionLevel.ALL,
            nullable = false,
            view = @View(
                    label = "Visibility",
                    value = VisibilitySelectView.class
            ))
    private Visibility visibility = Visibility.PRIVATE;

    /**
     * Order, first language is the default one
     */
    private Integer indexOrder;

    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            proposal = False.class, optional = false, nullable = false,
            protectionLevel = ProtectionLevel.INTERNAL,
            view = @View(label = "Enabled"))
    private boolean active = false;

    @ManyToOne
    @JsonIgnore
    private GameModel gameModel;

    @Override
    public Long getId() {
        return id;

    }

    /**
     * Get the language unique name (ie its code...)
     * TODO.rename/refactor
     *
     * @return
     */
    @Override
    @JsonIgnore
    public String getName() {
        return this.getCode();
    }

    /**
     * Set the language name (ie its code)
     *
     * @param name
     */
    @Override
    @JsonIgnore
    public void setName(String name) {
        this.setCode(name);
    }

    @Override
    @JsonIgnore
    public Integer getOrder() {
        return indexOrder;
    }

    public Integer getIndexOrder() {
        return indexOrder;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setIndexOrder(Integer indexOrder) {
        this.indexOrder = indexOrder;
    }

    /**
     * get the language identification code.
     * Code is always uppercase.
     *
     * @return Uppercase language identification code
     */
    public String getCode() {
        return code != null ? code.toUpperCase() : null;
    }

    /**
     * Set the language identification code.
     * The code will be uppercased.
     *
     * @param code the mew identification code
     */
    public void setCode(String code) {
        if (this.refName != null) {
            this.code = refName.toUpperCase();
            this.refName = null;
        } else {
            this.code = code != null ? code.toUpperCase() : null;
        }
    }

    @JsonIgnore
    public String getRefName() {
        return refName;
    }

    @JsonProperty
    public void setRefName(String refName) {
        if (refName != null) {
            this.refName = refName;
            this.code = refName.toUpperCase();
        } else {
            this.code = null;
            this.refName = null;
        }
    }

    /**
     * Language full name
     *
     * @return the language name to display
     */
    public String getLang() {
        return lang;
    }

    /**
     * Set the language displayed name
     *
     * @param language name to display
     */
    public void setLang(String language) {
        if (language != null) {
            this.lang = language.toLowerCase();
        } else {
            this.lang = null;
        }
    }

    @Override
    public Visibility getVisibility() {
        return this.visibility;
    }

    @Override
    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
    }

    public GameModel getGameModel() {
        return gameModel;
    }

    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getGameModel().getRequieredReadPermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getGameModel().getRequieredUpdatePermission();
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.gameModel;
    }
}
