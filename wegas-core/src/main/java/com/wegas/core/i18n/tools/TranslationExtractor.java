/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNashornException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.i18n.rest.I18nUpdate;
import com.wegas.core.i18n.rest.InScriptUpdate;
import com.wegas.core.i18n.rest.TranslationUpdate;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Script;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Automatic translation first. For each encountered translatable content, create a I18nUpdate which
 * contains: the translation of the ref language, the code of the new one.
 */
public class TranslationExtractor implements MergeHelper.MergeableVisitor {

    private static final Logger logger = LoggerFactory.getLogger(TranslationExtractor.class);

    /**
     * code of the language to initialise
     */
    private final String langCode;
    /**
     * code of the language to translate from
     */
    private final String refCode;
    private List<I18nUpdate> patchList = new LinkedList<>();

    /**
     * @param langCode language to initialise
     * @param refCode  language to translate from
     */
    public TranslationExtractor(String langCode, String refCode) {
        this.langCode = langCode;
        this.refCode = refCode;
    }

    /**
     * Get all extracted patches. Allpied as-is, those patch with copy the refCode translation to
     * the langCode ones
     *
     * @returns the list of extracted patches
     */
    public List<I18nUpdate> getPatches() {
        return patchList;
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
        if (target instanceof TranslatableContent) {
            TranslatableContent trTarget = (TranslatableContent) target;
            Translation source = trTarget.getTranslation(langCode);
            if (source != null && !Helper.isNullOrEmpty(source.getTranslation())) {
                if (!this.isProtected(trTarget, protectionLevel)) {
                    if (Helper.isNullOrEmpty(refCode) // re required empty translation
                        || trTarget.getTranslation(refCode) == null // requiered empty is null
                        || Helper.isNullOrEmpty(trTarget.getTranslation(refCode).getTranslation())) {
                        // exists but is empty
                        TranslationUpdate trUpdate = new TranslationUpdate();
                        trUpdate.setTrId(trTarget.getId());
                        trUpdate.setCode(langCode);
                        trUpdate.setValue(source.getTranslation());
                        patchList.add(trUpdate);
                    }
                }
            }
            return false;
        } else if (target instanceof Script) {
            if (!this.isProtected(target, protectionLevel)) {
                Script script = (Script) target;
                Mergeable parent = ancestors.getFirst();
                if (parent instanceof AbstractEntity) {
                    try {
                        List<FishedTranslation> inscript = I18nHelper.getTranslations(script.getContent(), langCode);
                        List<FishedTranslation> targetInScript = null;
                        if (!Helper.isNullOrEmpty(refCode)) {
                            targetInScript = I18nHelper.getTranslations(script.getContent(), refCode);
                        }
                        if (inscript != null) {
                            for (int index = 0; index < inscript.size(); index++) {
                                FishedTranslation inTr = inscript.get(index);
                                if (inTr instanceof FoundTranslation) {
                                    FoundTranslation foundSource = (FoundTranslation) inTr;
                                    String translation = foundSource.getTranslation();
                                    if (!Helper.isNullOrEmpty(translation)) {
                                        boolean refInitialised = false;
                                        if (targetInScript != null && targetInScript.size() > index) {
                                            FishedTranslation fishedRef = targetInScript.get(index);
                                            if (fishedRef instanceof FoundTranslation) {
                                                refInitialised = !Helper.isNullOrEmpty(((FoundTranslation) fishedRef).getTranslation());
                                            }
                                        }
                                        if (!refInitialised) {
                                            InScriptUpdate patch = new InScriptUpdate();
                                            patch.setParentClass(parent.getClass().getSimpleName());
                                            patch.setParentId(((AbstractEntity) parent).getId());
                                            patch.setFieldName(field.getField().getName());
                                            patch.setIndex(index);
                                            patch.setCode(langCode);
                                            patch.setValue(translation);
                                            patchList.add(patch);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (WegasNashornException ex) {
                        logger.error("Fails to parse script:  {}", ex);
                    }
                } else {
                    throw WegasErrorMessage.error("Unsupported parent: " + parent);
                }
            }
            return false;
        }
        return true;
    }

}
