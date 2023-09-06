/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasGraalException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.merge.utils.MergeHelper.MergeableVisitor;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Script;
import java.util.Deque;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Visitor to import translation from another gameModel.
 * <p>
 * Statuses of new translations is determined by comparing another-language translations.
 * <p>
 * given this structure:
 * <table>
 * <thead>
 * <tr>
 * <th colspan="4">Target GameModel
 * <th colspan="2">Reference GameModel
 * <tr>
 * <th>EN
 * <th>Before FR
 * <th>After FR
 * <th>FR status
 * <th>EN
 * <th>FR
 * <tbody>
 * <tr>
 * <td>Hello
 * <td>
 * <td>Bonjour
 * <td>up to date
 * <td>Hello
 * <td>Bonjour
 * <tr>
 * <td>Hi
 * <td>
 * <td>Bonjour
 * <td>outdated
 * <td>Hello
 * <td>Bonjour
 * </table>
 *
 * @author maxence
 */
public class ImportTranslationsVisitor implements MergeableVisitor {

    private static final Logger logger = LoggerFactory.getLogger(ImportTranslationsVisitor.class);

    /**
     * reference language code
     */
    private final String refLanguageCode;
    /**
     * code of language to import
     */
    private final String languageCode;

    public ImportTranslationsVisitor(String refLanguageCode, String languageCode) {
        this.languageCode = languageCode;
        this.refLanguageCode = refLanguageCode;
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
    private void importTranslationsInScript(Script target,
        Script source,
        String refLanguageCode,
        String languageCode
    ) {
        try {
            String newScript = target.getContent();

            List<TranslatableContent> targetTrs = I18nHelper.getTranslatableContents(newScript);
            List<TranslatableContent> sourceTrs = I18nHelper.getTranslatableContents(source
                .getContent());

            if (targetTrs.size() == sourceTrs.size()) {
                for (int i = 0; i < targetTrs.size(); i++) {
                    TranslatableContent targetTr = targetTrs.get(i);
                    TranslatableContent sourceTr = sourceTrs.get(i);

                    Translation translation = sourceTr.getTranslation(languageCode);

                    if (translation != null && !Helper.isNullOrEmpty(translation.getTranslation())) {
                        Translation refTarget = targetTr.getTranslation(refLanguageCode);
                        Translation refSource = sourceTr.getTranslation(refLanguageCode);

                        String status = "";
                        if (refTarget != null
                            && refSource != null
                            && !Objects.equals(refTarget.getTranslation(),
                                refSource.getTranslation())) {
                            status = "outdated";
                        }

                        if (Helper.isNullOrEmpty(status)) {
                            status = translation.getStatus();
                        }

                        newScript = I18nHelper.updateScriptWithNewTranslation(newScript, i,
                            languageCode, translation.getTranslation(), status);
                    }
                }
                target.setContent(newScript);
            }
        } catch (WegasGraalException ex) {
            logger.error("Fails to parse script: {}", ex);
        }
    }

    /**
     * {@inheritDoc }
     * import this.languageCode translations from references[0].
     */
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

                if (refTargetTr != null
                    && refTrRef != null
                    && !Objects.equals(
                        refTargetTr.getTranslation(), refTrRef.getTranslation())) {
                    newStatus = "outdated";
                }
                if (Helper.isNullOrEmpty(newStatus)) {
                    newStatus = trToCopy.getStatus();
                }

                trContent.updateTranslation(languageCode, trToCopy.getTranslation(), newStatus);
            }
            return false;
        }

        if (target instanceof Script && references.length > 0 && references[0] instanceof Script) {
            this.importTranslationsInScript((Script) target, (Script) references[0],
                refLanguageCode, languageCode);

            return false;
        }

        return true;
    }
}
