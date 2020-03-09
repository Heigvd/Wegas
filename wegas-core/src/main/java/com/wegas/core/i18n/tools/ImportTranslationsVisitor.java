/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.merge.utils.MergeHelper.MergeableVisitor;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Script;
import java.util.Deque;
import java.util.List;
import java.util.Objects;
import javax.script.ScriptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class ImportTranslationsVisitor implements MergeableVisitor {

    private static final Logger logger = LoggerFactory.getLogger(ImportTranslationsVisitor.class);

    private final String refLanguageCode;
    private final String languageCode;
    private final I18nFacade i18nFacade;

    public ImportTranslationsVisitor(String refLanguageCode, String languageCode, I18nFacade i18nFacade) {
        this.languageCode = languageCode;
        this.refLanguageCode = refLanguageCode;
        this.i18nFacade = i18nFacade;
    }

    /**
     * Update newTranslation in target for given language.
     *
     *
     * @param target       the script to update
     * @param source       the script which contains up to date newTranslation
     * @param reference    previous version of source
     * @param languageCode language to update
     */
    private void importTranslationsInScript(Script target, Script source, String refLanguageCode, String languageCode) {
        try {
            String newScript = target.getContent();

            List<TranslatableContent> targetTrs = i18nFacade.getInScriptTranslations(newScript);
            List<TranslatableContent> sourceTrs = i18nFacade.getInScriptTranslations(source.getContent());

            if (targetTrs.size() == sourceTrs.size()) {
                for (int i = 0; i < targetTrs.size(); i++) {
                    TranslatableContent targetTr = targetTrs.get(i);
                    TranslatableContent sourceTr = sourceTrs.get(i);

                    Translation translation = sourceTr.getTranslation(languageCode);

                    if (translation != null && !Helper.isNullOrEmpty(translation.getTranslation())) {
                        Translation refTarget = targetTr.getTranslation(refLanguageCode);
                        Translation refSource = sourceTr.getTranslation(refLanguageCode);

                        String status = "";
                        if (refTarget != null && refSource != null && !Objects.equals(refTarget.getTranslation(), refSource.getTranslation())) {
                            status = "outdated";
                        }
                        if (Helper.isNullOrEmpty(status)) {
                            status = translation.getStatus();
                        }

                        newScript = i18nFacade.updateScriptWithNewTranslation(newScript, i,
                            languageCode, translation.getTranslation(), status);
                    }
                }
                target.setContent(newScript);
            }
        } catch (ScriptException ex) {
            logger.error("Ouille ouille ouille: {}", ex);
        }
    }

    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level,
        WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable references[]) {

        if (target instanceof TranslatableContent
            && references.length > 0 && references[0] instanceof TranslatableContent) {

            TranslatableContent trContent = (TranslatableContent) target;
            TranslatableContent trContentRef = (TranslatableContent) references[0];

            Translation trToCopy = trContentRef.getTranslation(languageCode);

            if (trToCopy != null) {
                // guess new translation status
                Translation refTargetTr = trContent.getTranslation(refLanguageCode);
                Translation refTrRef = trContentRef.getTranslation(refLanguageCode);
                String newStatus = "";

                if (refTargetTr != null && refTrRef != null) {
                    if (!Objects.equals(refTargetTr.getTranslation(), refTrRef.getTranslation())) {
                        newStatus = "outdated";
                    }
                }
                if (Helper.isNullOrEmpty(newStatus)) {
                    newStatus = trToCopy.getStatus();
                }

                trContent.updateTranslation(languageCode, trToCopy.getTranslation(), newStatus);
            }
            return false;
        }

        if (target instanceof Script && references.length > 0 && references[0] instanceof Script) {
            this.importTranslationsInScript((Script) target, (Script) references[0], refLanguageCode, languageCode);

            return false;
        }

        return true;
    }
}
