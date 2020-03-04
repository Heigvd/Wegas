/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.tools;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 *
 * @author maxence
 */
public class RegexExtractorVisitor implements MergeHelper.MergeableVisitor {

    private final Pattern pattern;
    private final FindAndReplacePayload payload;
    private final List<List<String>> result;
    private final VariableDescriptorFacade variableDescriptorFacade;

    private int flags = Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS;

    public RegexExtractorVisitor(FindAndReplacePayload payload, VariableDescriptorFacade vdf) {
        this.payload = payload;
        this.variableDescriptorFacade = vdf;
        if (!payload.isMatchCase()) {
            flags |= Pattern.CASE_INSENSITIVE;
        }
        this.pattern = Pattern.compile(payload.getFind(), flags);
        this.result = new ArrayList<>();
    }

    /**
     *
     * @param content
     *
     */
    public void collect(String content) {
        if (!Helper.isNullOrEmpty(content)) {
            Matcher matcher = pattern.matcher(content);
            while (matcher.find()) {
                List<String> occurences = new ArrayList<>();
                if (matcher.groupCount() > 0) {
                    // capturing groups
                    for (int i = 0; i < matcher.groupCount(); i++) {
                        String group = matcher.group(i + 1);
                        if (!Helper.isNullOrEmpty(group)) {
                            occurences.add(matcher.group(i + 1));
                        }
                    }
                } else {
                    // no capturing group
                    occurences.add(matcher.group());
                }
                if (!occurences.isEmpty()) {
                    result.add(occurences);
                }
            }
        }
    }

    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel,
        int level, WegasFieldProperties field, Deque<Mergeable> ancestors,
        Mergeable... references) {

        if (target instanceof Translation) {
            Translation tr = (Translation) target;
            if (this.payload.shouldProcessLang(tr.getLang())) {
                this.collect(tr.getTranslation());
            }
            return false;
        }
        return true;
    }

    @Override
    public void visitProperty(Object target, ProtectionLevel protectionLevel,
        int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Object key,
        Object... references) {
        if (!this.isProtected(ancestors.peekFirst(), protectionLevel)) {
            if (field != null) {
                if (field.getAnnotation() != null) {
                    if (field.getAnnotation().searchable()) {
                        if (target instanceof String) {
                            if (field.getType() == WegasFieldProperties.FieldType.PROPERTY) {
                                this.collect((String) target);
                            }
                        }
                    }
                }
            }
        }
    }

    public void processStyles(GameModel gameModel) {
        this.processLibrary(gameModel.getCssLibraryList(), "Stylesheet");
    }

    public void processScripts(GameModel gameModel) {
        this.processLibrary(gameModel.getClientScriptLibraryList(), "Client Script");
        this.processLibrary(gameModel.getScriptLibraryList(), "Server Script");
    }

    private void processLibrary(List<GameModelContent> library, String title) {
        for (GameModelContent content : library) {
            this.collect(content.getContent());
        }
    }

    public void processPages(GameModel gameModel) {
        Map<String, JsonNode> pages = gameModel.getPages();
        for (Map.Entry<String, JsonNode> entry : pages.entrySet()) {
            JsonNode page = entry.getValue();
            String content = page.toString();
            this.collect(content);
        }
    }

    public List<List<String>> process(GameModel gameModel) {
        if (payload.getProcessVariables()) {

            if (payload.getRoots() != null && !payload.getRoots().isEmpty()) {
                for (String variableName : payload.getRoots()) {
                    try {
                        VariableDescriptor variable = variableDescriptorFacade.find(gameModel, variableName);
                        MergeHelper.visitMergeable(variable, Boolean.TRUE, this);
                    } catch (WegasNoResultException ex) {
                        throw WegasErrorMessage.error("Variable \"" + variableName + "\" not found");
                    }
                }
            } else {
                MergeHelper.visitMergeable(gameModel, Boolean.TRUE, this);
            }

        }

        if (payload.getProcessPages()) {
            this.processPages(gameModel);
        }

        if (payload.getProcessScripts()) {
            this.processScripts(gameModel);
        }

        if (payload.getProcessStyles()) {
            this.processStyles(gameModel);
        }

        return this.result;
    }
}
