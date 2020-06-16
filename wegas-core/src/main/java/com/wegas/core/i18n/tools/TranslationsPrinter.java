/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasNashornException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.Deque;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Visitor which pretty print all translation found in the Mergeable tree
 */
public class TranslationsPrinter implements MergeHelper.MergeableVisitor {

    private static final Logger logger = LoggerFactory.getLogger(TranslationsPrinter.class);

    /**
     * list of languages to display
     */
    private String[] languages;
    /**
     * Accumulator
     */
    private StringBuilder sb = new StringBuilder();

    /**
     * Create a pretty printer
     *
     * @param languages list of language code to display
     */
    public TranslationsPrinter(String[] languages) {
        this.languages = languages;
    }

    /**
     * indent message and break line
     *
     * @param msg   message to print
     * @param level indentation level
     */
    private void print(String msg, int level) {
        for (int i = 0; i < level; i++) {
            sb.append("    ");
        }
        sb.append(msg);
        sb.append(System.lineSeparator());
    }

    /**
     * Go through the given TranslatableContent and print requested languages
     *
     * @param trc   translatable content to process
     * @param level indentation level
     */
    private void process(TranslatableContent trc, int level) {
        StringBuilder line = new StringBuilder();
        for (String code : languages) {
            String tr;
            Translation translation = trc.getTranslation(code);
            line.append('[').append(code);
            if (translation != null) {
                if (Helper.isNullOrEmpty(translation.getStatus())) {
                    line.append("] ");
                } else {
                    line.append(", ").append(translation.getStatus()).append("] ");
                }
                tr = translation.getTranslation();
            } else {
                line.append("] ");
                tr = "<N/A>";
            }
            line.append(tr);
            if (tr.length() < 30) {
                for (int i = 0; i < 30 - tr.length(); i++) {
                    line.append(' ');
                }
            }
            line.append("    ");
        }
        print(line.toString(), level + 1);
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
        if (target instanceof VariableDescriptor) {
            print(((VariableDescriptor) target).getName(), level);
        }
        if (field != null) {
            print(field.getField().getName(), level);
        }
        if (target instanceof TranslatableContent) {
            TranslatableContent trTarget = (TranslatableContent) target;
            process(trTarget, level);
            return false;
        } else if (target instanceof Script) {
            try {
                List<TranslatableContent> inscript = I18nHelper.getTranslatableContents(((Script) target).getContent());
                for (TranslatableContent trc : inscript) {
                    process(trc, level);
                }
            } catch (WegasNashornException ex) {
                print("Unparsable script !", level);
                logger.error("FAILS {}", ex);
            }
        }
        return true;
    }

    @Override
    public String toString() {
        return sb.toString();
    }
}
