/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.persistence.*;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence
 */
@Entity
@Table(indexes = {
    @Index(columnList = "parentdescriptor_id"),
    @Index(columnList = "parentinstance_id")
})
public class TranslatableContent extends AbstractEntity implements Searchable, Broadcastable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(TranslatableContent.class);

    @ManyToOne
    @JsonIgnore
    private VariableDescriptor parentDescriptor;

    @ManyToOne
    @JsonIgnore
    private VariableInstance parentInstance;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    private List<Translation> translations = new ArrayList<>();

    @Override
    public Long getId() {
        return this.id;
    }

    public VariableDescriptor getParentDescriptor() {
        return parentDescriptor;
    }

    public void setParentDescriptor(VariableDescriptor parentDescriptor) {
        this.parentDescriptor = parentDescriptor;
        if (this.parentDescriptor != null) {
            this.parentInstance = null;
        }
    }

    public VariableInstance getParentInstance() {
        return parentInstance;
    }

    public void setParentInstance(VariableInstance parentInstance) {
        this.parentInstance = parentInstance;
        if (this.parentInstance != null) {
            this.parentDescriptor = null;
        }
    }

    /**
     * Nearest broadcastable parent
     *
     * @return
     */
    @JsonIgnore
    public Broadcastable getOwner() {
        if (this.parentDescriptor != null) {
            return parentDescriptor;
        }
        if (this.parentInstance != null) {
            return parentInstance;
        }
        return null;
    }

    @JsonIgnore
    public List<Translation> getRawTranslations() {
        return this.translations;
    }

    @JsonIgnore
    public Map<String, String> getModifiableTranslations() {
        return ListUtils.mapEntries(translations, new Translation.Extractor());
    }

    /**
     *
     * @return the translations
     */
    @JsonProperty
    public Map<String, String> getTranslations() {
        return Collections.unmodifiableMap(this.getModifiableTranslations());
    }

    /**
     *
     * @param translations
     */
    @JsonProperty
    public void setTranslations(Map<String, String> translations) {
        this.translations.clear();
        for (Entry<String, String> entry : translations.entrySet()) {
            this.translations.add(new Translation(entry.getKey(), entry.getValue()));
        }
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof TranslatableContent) {
            this.setTranslations(((TranslatableContent) other).getTranslations());
        }
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        for (Translation translation : this.translations) {
            if (Helper.insensitiveContainsAll(translation.getTranslation(), criterias)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get a translation
     *
     * @param refName language ref name
     *
     * @return the translation or null if there is no such translation
     *
     */
    public Translation getTranslation(String refName) {
        if (refName != null) {
            for (Translation tr : this.translations) {
                if (refName.equals(tr.getLang())) {
                    return tr;
                }
            }
        }
        return null;
    }

    /**
     * Update or set a translation
     *
     * @param refName     language ref name
     * @param translation the new translation
     */
    public void updateTranslation(String refName, String translation) {
        Translation tr = this.getTranslation(refName);
        if (tr != null) {
            tr.setTranslation(translation);
        } else {
            this.getRawTranslations().add(new Translation(refName, translation));
        }
    }

    /**
     * Get the most preferred translation for the given player.
     *
     * @param player
     *
     * @return
     */
    public Translation translate(Player player) {
        GameModel gameModel = player.getGameModel();
        return this.translate(gameModel.getPreferredLanguagesRefName(player));
    }

    public String translateOrEmpty(Player self) {
        Translation tr = this.translate(self);
        if (tr != null) {
            return tr.getTranslation();
        } else {
            return "";
        }
    }

    private Translation translate(GameModel gameModel, String refName) {
        return this.translate(gameModel.getPreferredLanguagesRefName(refName));
    }

    public String translateOrEmpty(GameModel gameModel, String refName) {
        Translation tr = this.translate(gameModel, refName);
        if (tr != null) {
            return tr.getTranslation();
        } else {
            return "";
        }
    }

    @JsonIgnore
    public Translation getAnyTranslation() {
        Translation emptyOne = null;

        for (Translation tr : this.translations) {
            if (tr != null) {
                String str = tr.getTranslation();
                if (str != null) {
                    if (str.isEmpty()) {
                        if (emptyOne == null) {
                            emptyOne = tr;
                        }
                    } else {
                        return tr;
                    }
                }
            }
        }
        return emptyOne;
    }

    /**
     * Returns the most preferred translation according to given languages.
     * returns the first translation which is not empty. If all translation are empty
     * returns, the first non null, returns null o otherwise
     *
     * @param languages languages sorted by preference
     *
     * @return
     */
    private Translation translate(List<String> languages) {
        Map<String, Translation> trMap = ListUtils.mapEntries(translations, new Translation.Mapper());
        Translation emptyOne = null;

        for (String langRef : languages) {
            Translation tr = trMap.get(langRef);
            if (tr != null) {
                String str = tr.getTranslation();
                if (str != null) {
                    if (str.isEmpty()) {
                        if (emptyOne == null) {
                            emptyOne = tr;
                        }
                    } else {
                        return tr;
                    }
                }
            }
        }
        return emptyOne;
    }

    public Translation translate(GameModel gameModel) {
        if (gameModel != null) {
            Player player = gameModel.findTestPlayer();
            return this.translate(gameModel.getPreferredLanguagesRefName(player));
        } else {
            return getAnyTranslation();
        }
    }

    public String translateOrEmpty(GameModel gameModel) {
        Translation tr = this.translate(gameModel);
        if (tr != null) {
            return tr.getTranslation();
        } else {
            return "";
        }
    }


    /*
     * SECURITY
     */
    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        Broadcastable owner = getOwner();
        if (owner != null) {
            return owner.getRequieredUpdatePermission();
        }
        logger.error("Orphan here {}", this);
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        Broadcastable owner = getOwner();
        if (owner != null) {
            return owner.getRequieredReadPermission();
        }
        logger.error("Orphan here {}", this);

        return null;
    }

    public static TranslatableContent build(String lang, String translation) {
        TranslatableContent trC = new TranslatableContent();
        trC.getRawTranslations().add(new Translation(lang, translation));
        return trC;
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Broadcastable owner = this.getOwner();
        if (owner != null) {
            return owner.getEntities();
        }
        return null;
    }

    /**
     * Convenient method to use within merge implementation.
     * other may be null, in this case, null is returned.
     * target may be null, a brand new object will be returned.
     * <p>
     * <p>
     * in merge example: this.setField(TranslatableContent.merger(this.getField(), o.getField()))
     *
     * @param target the one to update, may be null
     * @param other  the one to copy content from, may be null
     *
     * @return the new translatable content the caller must use form now
     */
    public static TranslatableContent merger(TranslatableContent target, TranslatableContent other) {
        if (other == null) {
            return null;
        }

        if (target == null) {
            target = new TranslatableContent();
        }
        target.merge(other);
        return target;
    }

    public static TranslatableContent readFromNashorn(JSObject jsTr) {
        if (jsTr != null) {
            Object theClass = jsTr.getMember("@class");
            TranslatableContent trContent = new TranslatableContent();

            if (theClass != null && theClass.equals("TranslatableContent")) {
                ScriptObjectMirror trs = (ScriptObjectMirror) jsTr.getMember("translations");
                String[] langs = trs.getOwnKeys(true);
                for (String refName : langs) {
                    trContent.updateTranslation(refName, (String) trs.getMember(refName));
                }
            }
            return trContent;
        } else {
            return null;
        }
    }
}
