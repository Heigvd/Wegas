/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.ejb;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasNashornException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.i18n.rest.I18nUpdate;
import com.wegas.core.i18n.tools.I18nHelper;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Script;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Mergeable visitor to clear translations of a given language
 *
 * @author maxence
 */
public class TranslationEraser implements MergeHelper.MergeableVisitor {

    private static final Logger logger = LoggerFactory.getLogger(TranslationEraser.class);

    private final String langCode;
    private final Boolean eraseAll;
    private List<I18nUpdate> patchList = new LinkedList<>();

    public TranslationEraser(String langCode, Boolean eraseAll) {
        this.langCode = langCode;
        this.eraseAll = eraseAll;
    }

    public List<I18nUpdate> getPatches() {
        return patchList;
    }

    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
        if (target instanceof Translation) {
            Translation tr = (Translation) target;
            if (!this.isProtected(tr.getTranslatableContent(), protectionLevel)) {
                if (tr.getLang().equals(this.langCode) && (this.eraseAll || !Helper.isNullOrEmpty(tr.getStatus()))) {
                    tr.setTranslation("");
                    tr.setStatus("cleared");
                }
            }
            return false;
        } else if (target instanceof Script) {
            try {
                if (!this.isProtected(target, protectionLevel)) {
                    Script script = (Script) target;
                    String newScript = script.getContent();
                    List<TranslatableContent> trs = I18nHelper.getTranslatableContents(newScript);
                    for (int i = 0; i < trs.size(); i++) {
                        TranslatableContent trc = trs.get(i);
                        Translation translation = trc.getTranslation(langCode);
                        if (translation != null) {
                            if (this.eraseAll || !Helper.isNullOrEmpty(translation.getStatus())) {
                                newScript = I18nHelper.updateScriptWithNewTranslation(newScript, i, this.langCode, "", "cleared");
                            }
                        }
                    }
                    script.setContent(newScript);
                }
            } catch (WegasNashornException ex) {
                logger.error("Fail to parse script: {}", ex);
            }
            return false;
        }
        return true;
    }

}
