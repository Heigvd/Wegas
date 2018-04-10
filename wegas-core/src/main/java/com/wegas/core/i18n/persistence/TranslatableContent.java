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
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.persistence.*;

/**
 *
 * @author Maxence
 */
@Entity
@Table(indexes = { //@Index(columnList = "inboxinstance_id")
})
public class TranslatableContent extends AbstractEntity implements Searchable {

    private static final long serialVersionUID = 1L;

    /**
     * HACKME !!!
     */
    @Transient
    @JsonIgnore
    private AbstractEntity owner;

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

    public AbstractEntity getOwner() {
        return owner;
    }

    public void setOwner(AbstractEntity owner) {
        this.owner = owner;
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
     * Get the most preferred translation for the given player.
     *
     * @param player
     *
     * @return
     */
    public Translation translate(Player player) {
        GameModel gameModel = player.getGameModel();

        List<String> refs = gameModel.getPreferredLanguagesRefName(player);

        Map<String, Translation> trMap = ListUtils.mapEntries(translations, new Translation.Mapper());

        for (String langRef : refs) {
            Translation tr = trMap.get(langRef);
            if (tr != null && Helper.isNullOrEmpty(tr.getTranslation())) {
                return tr;
            }
        }
        return null;
    }

    public String translateOrEmpty(Player self) {
        Translation tr = this.translate(self);
        if (tr != null) {
            return tr.getTranslation();
        } else {
            return "";
        }
    }

    public Translation translate(GameModel gameModel) {
        List<String> refs = gameModel.getPreferredLanguagesRefName(null);

        Map<String, Translation> trMap = ListUtils.mapEntries(translations, new Translation.Mapper());

        for (String langRef : refs) {
            Translation tr = trMap.get(langRef);
            if (tr != null && Helper.isNullOrEmpty(tr.getTranslation())) {
                return tr;
            }
        }
        return null;
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
        if (this.owner != null) {
            return owner.getRequieredUpdatePermission();
        }
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        if (this.owner != null) {
            return owner.getRequieredReadPermission();
        }
        return null;
    }

    public static TranslatableContent build(String lang, String translation){
        TranslatableContent trC = new TranslatableContent();
        trC.getRawTranslations().add(new Translation(lang, translation));
        return trC;
    }
}
