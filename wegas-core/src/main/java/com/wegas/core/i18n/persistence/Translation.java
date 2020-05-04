/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.view.StringView;
import java.util.Collection;
import java.util.Objects;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.IdClass;
import javax.persistence.Index;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

/**
 *
 * Based on VariableProperty but with @Lob
 *
 * @author maxence
 */
@Entity
@Table(
    name = "translatablecontent_translations",
    indexes = {
        @Index(columnList = "translatablecontent_id")
    }
)
@IdClass(Translation.TranslationKey.class)
public class Translation implements WithPermission {

    public static class TranslationKey {

        private String lang;
        private Long trId;

        @Override
        public int hashCode() {
            int hash = 3;
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
            final TranslationKey other = (TranslationKey) obj;
            if (!Objects.equals(this.lang, other.lang)) {
                return false;
            }
            if (!Objects.equals(this.trId, other.trId)) {
                return false;
            }
            return true;
        }
    }

    @JsonIgnore
    @Id
    @WegasEntityProperty(initOnly = true, optional = false, nullable = false,
        view = @View(label = "Language", readOnly = true, value = StringView.class))
    @JsonView(Views.IndexI.class)
    private String lang;

    @ManyToOne
    @JsonIgnore
    private TranslatableContent translatableContent;

    @Id
    @Column(name = "translatablecontent_id", insertable = false, updatable = false, columnDefinition = "bigint")
    @JsonView(Views.IndexI.class)
    private Long trId;

    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @Column(name = "tr")
    @WegasEntityProperty(searchable = true, view = @View(label = "Text"),
        proposal = EmptyString.class,
        optional = false, nullable = false)
    private String translation;

    @WegasEntityProperty(initOnly = true, view = @View(label = "Status"),
        proposal = EmptyString.class,
        optional = false, nullable = false)
    private String status;

    public Translation() {
    }

    public Translation(String lang, String translation) {
        this(lang, translation, null, null);
    }

    public Translation(String lang, String translation, String status, TranslatableContent owner) {
        if (lang != null) {
            this.lang = lang.toUpperCase();
        }
        this.translatableContent = owner;
        if (owner != null) {
            this.trId = owner.getId();
        }
        this.translation = translation;
        this.status = status;
    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 79 * hash + Objects.hashCode(this.lang);
        hash = 79 * hash + Objects.hashCode(this.trId);
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
        final Translation other = (Translation) obj;
        if (!Objects.equals(this.lang, other.lang)) {
            return false;
        }
        if (!Objects.equals(this.trId, other.trId)) {
            return false;
        }
        return true;
    }

    public String getLang() {
        return lang != null ? lang.toUpperCase() : null;
    }

    public void setLang(String lang) {
        if (lang != null) {
            this.lang = lang.toUpperCase();
        } else {
            this.lang = null;
        }
    }

    public TranslatableContent getTranslatableContent() {
        return translatableContent;
    }

    public void setTranslatableContent(TranslatableContent translatableContent) {
        if (translatableContent != null) {
            this.trId = translatableContent.getId();
        } else {
            this.trId = null;
        }
        this.translatableContent = translatableContent;
    }

    public Long getTrId() {
        return trId;
    }

    public void setTrId(Long trId) {
        this.trId = trId;
    }

    public String getTranslation() {
        return translation;
    }

    public void setTranslation(String translation) {
        this.translation = translation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "Translation [" + lang + "] " + translation;
    }

    public static class Mapper implements ListUtils.EntryExtractor<String, Translation, Translation> {

        @Override
        public String getKey(Translation item) {
            return item.getLang();
        }

        @Override
        public Translation getValue(Translation item) {
            return item;
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        return this.getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredDeletePermission() {
        return getMergeableParent().getRequieredDeletePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return getMergeableParent().getRequieredReadPermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        Collection<WegasPermission> perms = this.getMergeableParent().getRequieredUpdatePermission();

        GameModel gm = this.getParentGameModel();

        WegasPermission anyLangPerm = gm.getAssociatedTranslatePermission("");
        perms.remove(anyLangPerm);
        perms.add(gm.getAssociatedTranslatePermission(this.getLang()));

        return perms;
    }

    @Override
    public WithPermission getMergeableParent() {
        return translatableContent;
    }

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
        return this.getMergeableParent().getRefId() + "::" + this.getLang();
    }

    @Override
    public void setRefId(String refId) {
        // no-op
    }

}
