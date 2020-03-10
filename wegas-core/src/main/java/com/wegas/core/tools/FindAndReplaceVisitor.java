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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.difflib.algorithm.DiffException;
import com.github.difflib.text.DiffRow;
import com.github.difflib.text.DiffRowGenerator;
import com.wegas.core.Helper;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 *
 * @author maxence
 */
public class FindAndReplaceVisitor implements MergeHelper.MergeableVisitor {
    
    private final DiffRowGenerator generator;
    private final StringBuilder output;
    private final Pattern pattern;
    private final List<String> pages = new ArrayList<>();
    private final List<GameModelContent> contents = new ArrayList<>();
    private final FindAndReplacePayload payload;
    private int flags = Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS;

    public FindAndReplaceVisitor(FindAndReplacePayload payload) {
        this.payload = payload;
        if (!payload.isMatchCase()) {
            flags |= Pattern.CASE_INSENSITIVE;
        }
        if (!payload.isRegex()) {
            flags |= Pattern.LITERAL;
        }
        this.pattern = Pattern.compile(payload.getFind(), flags);
        this.output = new StringBuilder();
        this.generator = DiffRowGenerator.create().showInlineDiffs(true).inlineDiffByWord(true).mergeOriginalRevised(true).build();
    }

    /**
     *
     * @param content
     *
     * @return content with replacement done or null id nothing to replace
     */
    public String replace(String content) {
        if (!Helper.isNullOrEmpty(content)) {
            Matcher matcher = pattern.matcher(content);
            String newContent = matcher.replaceAll(payload.getReplace());
            if (!content.equals(newContent)) {
                return newContent;
            }
        }
        return null;
    }

    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable... references) {
        if (target instanceof Translation) {
            Translation tr = (Translation) target;
            if (this.payload.shouldProcessLang(tr.getLang())) {
                String newContent = this.replace(tr.getTranslation());
                if (newContent != null) {
                    this.genEntry(ancestors, target, field, tr.getTranslation(), newContent);
                    if (!payload.isPretend()) {
                        tr.setTranslation(newContent);
                    }
                }
            }
            return false;
        }
        return true;
    }

    @Override
    public void visitProperty(Object target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Object key, Object... references) {
        if (!this.isProtected(ancestors.peekFirst(), protectionLevel)) {
            if (field != null) {
                if (field.getAnnotation() != null) {
                    if (field.getAnnotation().searchable()) {
                        if (target instanceof String) {
                            if (field.getType() == WegasFieldProperties.FieldType.PROPERTY) {
                                String newContent = this.replace((String) target);
                                if (newContent != null) {
                                    this.genEntry(ancestors, target, field, (String) target, newContent);
                                    if (!payload.isPretend()) {
                                        try {
                                            update(newContent, target, protectionLevel, level, field, ancestors, key, references);
                                        } catch (Exception ex) {
                                            output.append("<br/> ERROR: ").append(ex);
                                        }
                                    }
                                }
                            }
                        } else if (target instanceof JsonNode) {
                            if (field.getField().getName().equals("pages") && ancestors.peekFirst() instanceof GameModel) {
                                JsonNode node = (ObjectNode) target;
                                String content = node.toString();
                                String newContent = this.replace(node.toString());
                                if (newContent != null) {
                                    this.genEntry(ancestors, null, field, content, newContent);
                                    if (!payload.isPretend()) {
                                        try {
                                            JsonNode newNode = JacksonMapperProvider.getMapper().readTree(newContent);
                                            update(newNode, target, protectionLevel, level, field, ancestors, key, references);
                                        } catch (Exception ex) {
                                            output.append("<br/> ERROR: ").append(ex);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Update the property
     *
     * @param newValue
     * @param target
     * @param protectionLevel
     * @param level
     * @param field
     * @param ancestors
     * @param key
     * @param references
     *
     * @throws IllegalAccessException
     * @throws IllegalArgumentException
     * @throws InvocationTargetException
     */
    private void update(Object newValue, Object target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Object key, Object... references) throws IllegalAccessException, IllegalArgumentException, InvocationTargetException {
        if (field.getType() == WegasFieldProperties.FieldType.CHILDREN) {
            Object get = field.getPropertyDescriptor().getReadMethod().invoke(ancestors.peekFirst());
            if (get instanceof Map) {
                Map map = (Map) get;
                map.put(key, newValue);
                field.getPropertyDescriptor().getWriteMethod().invoke(ancestors.peekFirst(), map);
            } else if (get instanceof List && key instanceof Integer) {
                List list = (List) get;
                list.remove(key);
                list.add((int) key, newValue);
                field.getPropertyDescriptor().getWriteMethod().invoke(ancestors.peekFirst(), list);
            } else if (get instanceof Set) {
                Set set = (Set) get;
                set.remove(target);
                set.add(newValue);
                field.getPropertyDescriptor().getWriteMethod().invoke(ancestors.peekFirst(), set);
            }
        } else if (field.getType() == WegasFieldProperties.FieldType.PROPERTY) {
            field.getPropertyDescriptor().getWriteMethod().invoke(ancestors.peekFirst(), newValue);
        }
    }

    public String getOutput() {
        return output.toString();
    }

    public void processPages(GameModel gameModel) {
        if (!this.isProtected(gameModel, ProtectionLevel.ALL)) {
            Map<String, JsonNode> pages = gameModel.getPages();
            for (Map.Entry<String, JsonNode> entry : pages.entrySet()) {
                JsonNode page = entry.getValue();
                String pageId = entry.getKey();
                String content = page.toString();
                String newContent = this.replace(content);
                if (newContent != null) {
                    this.genEntry("Page " + pageId, prettyPrintJson(content), prettyPrintJson(newContent));
                    if (!payload.isPretend()) {
                        try {
                            JsonNode newNode = JacksonMapperProvider.getMapper().readTree(newContent);
                            pages.put(pageId, newNode);
                            // propagation
                            this.pages.add(pageId);
                        } catch (Exception ex) {
                            output.append("<br/> ERROR: ").append(ex);
                        }
                    }
                }
            }
            gameModel.setPages(pages);
        }
    }

    private void processLibrary(List<GameModelContent> library, String title) {
        for (GameModelContent content : library) {
            String newContent = this.replace(content.getContent());
            if (newContent != null) {
                this.genEntry(title + "\"" + content.getContentKey() + "\"", content.getContent(), newContent);
                if (!payload.isPretend()) {
                    try {
                        content.setContent(newContent);
                        this.contents.add(content);
                    } catch (Exception ex) {
                        output.append("<br/> ERROR: ").append(ex);
                    }
                }
            }
        }
    }

    private String genName(Object object) {
        if (object instanceof VariableDescriptor) {
            return ((VariableDescriptor) object).getEditorLabel();
        }
        if (object instanceof LabelledEntity) {
            return ((LabelledEntity) object).getLabel().translateOrEmpty((GameModel) null);
        }
        if (object instanceof NamedEntity) {
            return ((NamedEntity) object).getName();
        }
        if (object instanceof State) {
            return "#" + ((State) object).getIndex();
        }
        if (object instanceof Translation) {
            return "[" + ((Translation) object).getLang() + "]";
        }
        return null;
    }

    private StringBuilder ancestorsPrettyPrinter(Deque<Mergeable> ancestors, Object target, WegasFieldProperties field) {
        StringBuilder sb = new StringBuilder();
        Iterator<Mergeable> it = ancestors.descendingIterator();
        while (it.hasNext()) {
            Mergeable ancestor = it.next();
            if (ancestor instanceof GameModel == false) {
                String name = genName(ancestor);
                /*if (Helper.isNullOrEmpty(name)) {
                name = ancestor.getClass().getSimpleName();
                }*/
                if (!Helper.isNullOrEmpty(name)) {
                    sb.append(name);
                    if (it.hasNext()) {
                        sb.append(" ⇨ ");
                    }
                }
            }
        }
        String name = genName(target);
        if (!Helper.isNullOrEmpty(name)) {
            sb.append(name);
        }
        if (field != null && field.getField() != null) {
            sb.append("::").append(field.getField().getName());
        }
        return sb;
    }

    private void genEntry(Deque<Mergeable> ancestors, Object target, WegasFieldProperties field, String oldContent, String newContent) {
        this.genEntry(this.ancestorsPrettyPrinter(ancestors, target, field).toString(), oldContent, newContent);
    }

    private String prettyPrintJson(String content) {
        try {
            ObjectMapper mapper = JacksonMapperProvider.getMapper();
            JsonNode tree = mapper.readTree(content);
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(tree);
        } catch (IOException ex) {
            return content;
        }
    }

    private void genEntry(String title, String oldContent, String newContent) {
        output.append("<div class='find-result-entry'>");
        output.append("  <div class='find-result-entry-title'>").append(title).append("</div>");
        try {
            List<DiffRow> rows = generator.generateDiffRows(Arrays.asList(oldContent.split("\\n")), Arrays.asList(newContent.split("\\n")));
            output.append("  <div class='find-result-entry-diff");
            if (rows.size() > 1) {
                output.append(" show-lines");
            }
            output.append("'>");
            boolean skip = false;
            for (int i = 0; i < rows.size(); i++) {
                DiffRow row = rows.get(i);
                if (row.getTag() != DiffRow.Tag.EQUAL) {
                    output.append("<div class='find-result-entry-line'>");
                    output.append("<span class='find-result-entry-number'>").append(i).append("</span>");
                    output.append("<span class='find-result-entry-change'>").append(row.getOldLine()).append("</span>");
                    output.append("</div>");
                    skip = false;
                } else if (!skip) {
                    output.append("<div class='find-result-entry-skip'>").append("[...]").append("</div>");
                    skip = true;
                }
            }
            output.append("  </div>");
        } catch (DiffException ex) {
            output.append("<div class='find-result-entry-sidebyside'>");
            output.append("  <div class='find-result-entry-old'>").append(oldContent).append("</div>");
            output.append("  <div class='find-result-entry-new'>").append(newContent).append("</div>");
            output.append("</div>");
        }
        output.append("</div>");
    }

    public void processStyles(GameModel gameModel) {
        this.processLibrary(gameModel.getCssLibraryList(), "Stylesheet");
    }

    public void processScripts(GameModel gameModel) {
        this.processLibrary(gameModel.getClientScriptLibraryList(), "Client Script");
        this.processLibrary(gameModel.getScriptLibraryList(), "Server Script");
    }

    public void propagate(GameModel gameModel, WebsocketFacade websocketFacade) {
        for (String pageId : pages) {
            websocketFacade.pageUpdate(gameModel.getId(), pageId, null); //no requestId allows the requester to be notified too
        }
        //for (GameModelContent content : contents) {
        //websocketFacade.gameModelContentUpdate(content, null); //no requestId allows the requester to be notified too
        //}
    }
    
}
