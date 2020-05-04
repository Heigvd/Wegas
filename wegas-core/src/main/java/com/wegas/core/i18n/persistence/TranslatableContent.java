/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasErrorMessage;
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
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.view.NumberView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Version;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.eclipse.persistence.annotations.OptimisticLocking;
import org.eclipse.persistence.annotations.PrivateOwned;

/**
 *
 * @author Maxence
 */
@Entity
@Table(indexes = {
    @Index(columnList = "parentdescriptor_id"),
    @Index(columnList = "parentinstance_id")
})
@OptimisticLocking(cascade = true)
public class TranslatableContent extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    @ManyToOne
    @JsonIgnore
    private VariableDescriptor parentDescriptor;

    @ManyToOne
    @JsonIgnore
    private VariableInstance parentInstance;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(nullable = false, optional = false, proposal = Zero.class,
            sameEntityOnly = true, view = @View(
                    label = "Version",
                    readOnly = true,
                    value = NumberView.class,
                    featureLevel = ADVANCED
            )
    )
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
    @JsonIgnore
    @WegasEntityProperty(searchable = true, callback = TranslatableCallback.class,
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Translations"))
    @OneToMany(mappedBy = "translatableContent", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @PrivateOwned
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

    public VariableInstance getParentInstance() {
        return parentInstance;
    }

    public void setParentInstance(VariableInstance parentInstance) {
        this.parentInstance = parentInstance;
        if (this.parentInstance != null) {
            this.parentDescriptor = null;
        }
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
            value.setTranslatableContent(this);
            this.translations.add(value);
            //this.translations.add(new Translation(entry.getKey(), value.getTranslation(), value.getStatus(), this));
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
    public Translation removeTranslation(String languageCode) {
        Translation translation = this.getTranslation(languageCode);
        if (translation != null) {
            this.translations.remove(translation);
        }
        return translation;
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
            this.getRawTranslations().add(new Translation(code, translation, null, this));
        }
    }

    public void updateTranslation(String code, String translation, String status) {
        Translation tr = this.getTranslation(code);
        if (tr != null) {
            tr.setTranslation(translation);
            tr.setStatus(status);
        } else {
            this.getRawTranslations().add(new Translation(code, translation, status, this));
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
     * Returns the most preferred translation according to given languages. returns the first
     * translation which is not empty. If all translation are empty returns, the first non null,
     * returns null o otherwise
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
            Player player = gameModel.getTestPlayer();
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
            Collection<WegasPermission> perms = owner.getRequieredUpdatePermission();
            perms.add(this.getParentGameModel().getAssociatedTranslatePermission(""));
            return perms;
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
        trC.getRawTranslations().add(new Translation(lang, translation, "", trC));
        return trC;
    }

    public TranslatableContent createCopy() {
        TranslatableContent trC = new TranslatableContent();
        for (Translation t : this.getRawTranslations()) {
            trC.getRawTranslations().add(
                new Translation(t.getLang(), t.getTranslation(), 
                    t.getStatus(), trC));
        }
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
     * Convenient method to use within merge implementation. other may be null, in this case, null
     * is returned. target may be null, a brand new object will be returned.
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
                for (String code : langs) {
                    Object member = trs.getMember(code);
                    if (member instanceof String) {
                        trContent.updateTranslation(code, (String) member);
                    } else if (member instanceof ScriptObjectMirror) {
                        String tr = (String) ((ScriptObjectMirror) member).getMember("translation");
                        String status = (String) ((ScriptObjectMirror) member).getMember("status");
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

    public static class TranslatableCallback implements WegasCallback {

        @Override
        public void add(Object child, IMergeable container, Object identifier) {
            if (container instanceof TranslatableContent && child instanceof Translation) {
                ((Translation) child).setTranslatableContent((TranslatableContent) container);
            }
        }
    }
}
