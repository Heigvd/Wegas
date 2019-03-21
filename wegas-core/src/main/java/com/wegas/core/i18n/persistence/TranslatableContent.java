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
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
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
import org.graalvm.polyglot.Value;
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
//@OptimisticLocking
public class TranslatableContent extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(TranslatableContent.class);

    @ManyToOne
    @JsonIgnore
    private VariableDescriptor parentDescriptor;

    @ManyToOne
    @JsonIgnore
    private VariableInstance parentInstance;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(sameEntityOnly = true)
    @JsonView(Views.IndexI.class)
    private Long version;

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
    @WegasEntityProperty(searchable = true)
    private List<Translation> translations = new ArrayList<>();

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * Use with caution (it means NEVER but in custom JSON deserialisator)
     *
     * @param id
     */
    public void setId(Long id) {
        this.id = id;
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

    @JsonView(Views.IndexI.class)
    public Long getParentDescriptorId() {
        if (parentDescriptor != null) {
            return parentDescriptor.getId();
        }
        return null;
    }

    @JsonView(Views.IndexI.class)
    public void setParentDescriptorId(Long id) {
        // Jackson happy
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

    @JsonView(Views.IndexI.class)
    public Long getParentInstanceId() {
        if (parentInstance != null) {
            return parentInstance.getId();
        }
        return null;
    }

    @JsonView(Views.IndexI.class)
    public void setParentInstanceId(Long id) {
        // Jackson happy
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
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
    public Map<String, Translation> getModifiableTranslations() {
        return ListUtils.mapEntries(translations, new Translation.Mapper());
    }

    /**
     *
     * @return the translations
     */
    @JsonProperty
    public Map<String, Translation> getTranslations() {
        return Collections.unmodifiableMap(this.getModifiableTranslations());
    }

    /**
     *
     * @param translations
     */
    @JsonProperty
    public void setTranslations(Map<String, Translation> translations) {
        this.translations.clear();
        for (Entry<String, Translation> entry : translations.entrySet()) {
            Translation value = entry.getValue();
            this.translations.add(new Translation(entry.getKey(), value.getTranslation(), value.getStatus()));
        }
    }

    /**
     * Get a translation
     *
     * @param code language code
     *
     * @return the translation or null if there is no such translation
     *
     */
    public Translation getTranslation(String code) {
        if (code != null) {
            String CODE = code.toUpperCase();
            for (Translation tr : this.translations) {
                if (CODE.equals(tr.getLang())) {
                    return tr;
                }
            }
        }
        return null;
    }

    /**
     * remove a translation
     *
     * @param languageCode
     */
    public void removeTranslation(String languageCode) {
        Translation translation = this.getTranslation(languageCode);
        if (translation != null) {
            this.translations.remove(translation);
        }
    }

    /**
     * Update or set a translation
     *
     * @param code        language code
     * @param translation the new translation
     */
    public void updateTranslation(String code, String translation) {
        Translation tr = this.getTranslation(code);
        if (tr != null) {
            tr.setTranslation(translation);
        } else {
            this.getRawTranslations().add(new Translation(code, translation));
        }
    }

    public void updateTranslation(String code, String translation, String status) {
        Translation tr = this.getTranslation(code);
        if (tr != null) {
            tr.setTranslation(translation);
            tr.setStatus(status);
        } else {
            this.getRawTranslations().add(new Translation(code, translation, status));
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
        if (player != null) {
            GameModel gameModel = player.getGameModel();
            return this.translate(gameModel.getPreferredLanguagesCodes(player));
        } else {
            return this.getAnyTranslation();
        }
    }

    public String translateOrEmpty(Player self) {
        Translation tr = this.translate(self);
        if (tr != null) {
            return tr.getTranslation();
        } else {
            return "";
        }
    }

    private Translation translate(GameModel gameModel, String code) {
        return this.translate(gameModel.getPreferredLanguagesCode(code));
    }

    public String translateOrEmpty(GameModel gameModel, String code) {
        Translation tr = this.translate(gameModel, code);
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
     * @param languages languages codes sorted by preference
     *
     * @return
     */
    private Translation translate(List<String> languages) {
        Map<String, Translation> trMap = ListUtils.mapEntries(translations, new Translation.Mapper());
        Translation emptyOne = null;

        for (String code : languages) {
            Translation tr = trMap.get(code);
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
            return this.translate(gameModel.getPreferredLanguagesCodes(player));
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
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        Broadcastable owner = getOwner();
        if (owner != null) {
            return owner.getRequieredReadPermission();
        }

        return null;
    }

    public static TranslatableContent build(String lang, String translation) {
        TranslatableContent trC = new TranslatableContent();
        trC.getRawTranslations().add(new Translation(lang, translation, ""));
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

    /*@Override
    public boolean belongsToProtectedGameModel() {
        Mergeable parent = getParent();
        if (parent != null) {
            return parent.belongsToProtectedGameModel();
        }
        return false;
    }*/
    @Override
    public WithPermission getMergeableParent() {
        if (this.getParentDescriptor() != null) {
            return getParentDescriptor();
        } else {
            return getParentInstance();
        }
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


    public static TranslatableContent readFromPolyglot(Value jsTr) {
        if (jsTr != null) {
            Value theClass = jsTr.getMember("@class");
            TranslatableContent trContent = new TranslatableContent();

            if (theClass != null && "TranslatableContent".equals(theClass.asString())){
                Value trs = jsTr.getMember("translations");
                for (String code : trs.getMemberKeys()) {
                    Value member = trs.getMember(code);
                    if (member.isString()) {
                        // read I18n v1
                        trContent.updateTranslation(code, member.asString());
                    } else if (member.hasMembers()) {
                        Value vTr = member.getMember("translation");
                        Value vStatus = member.getMember("status");
                        String tr = vTr.isString() ? vTr.asString() : "";
                        String status = vStatus.isString() ? vStatus.asString() : "";

                        trContent.updateTranslation(code, tr, status);
                    } else if (member != null) {
                        throw WegasErrorMessage.error("Unhandled Translatable Content Type: " + member);
                    }
                }
            }
            return trContent;
        } else {
            return null;
        }
    }

    @Override
    public String toString() {
        return this.translateOrEmpty((GameModel) null);
    }
}
