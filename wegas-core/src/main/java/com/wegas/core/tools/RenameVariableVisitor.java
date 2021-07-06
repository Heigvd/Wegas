/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.tools;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * A visitor to rename variables in script and others cross-references.
 *
 * @author maxence
 */
public class RenameVariableVisitor implements MergeHelper.MergeableVisitor {

    /**
     * Old name to new name map
     */
    private final Map<String, String> nameMap;

    /**
     * Variable.find(oldName) to new statement
     */
    private final Map<Pattern, String> patterns;

    /**
     * Allow to update reference to variable.
     *
     * @param nameMap
     */
    public RenameVariableVisitor(Map<String, String> nameMap) {
        this.nameMap = nameMap;
        this.patterns = new HashMap<>();

        for (Map.Entry<String, String> entry : nameMap.entrySet()) {
            String oldName = entry.getKey();
            String newName = entry.getValue();
            this.patterns.put(
                Pattern.compile("Variable.find\\(gameModel, ([\"'])"
                    + Pattern.quote(oldName) + "([\"'])\\)",
                    Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
                ),
                "Variable.find(gameModel, $1" + newName + "$2)"
            );
        }
    }

    /**
     * Convert set of names. All names in the set will be replaced by their new name, according to
     * the nameMap.
     *
     * @param names set of name to convert
     *
     * @return migrated names
     */
    private Set<String> convert(Set<String> names) {
        if (names != null) {
            return names.stream()
                .map(this::convertName)
                .collect(Collectors.toSet());
        } else {
            return null;
        }
    }

    /**
     * Convert a name. If the given name exists in the map, the new name is returned. Otherwise, the
     * current name is returned.
     *
     * @param oldName the name to convert
     *
     * @return new name to use
     */
    private String convertName(String oldName) {
        if (this.nameMap.containsKey(oldName)) {
            return nameMap.get(oldName);
        } else {
            return oldName;
        }
    }

    @Override
    public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable... references) {
        if (target instanceof Script) {
            Script script = (Script) target;
            String content = script.getContent();
            // Convert all Variable.find(gameModel, "oldName") to Variable.find(gameModel, "newName")
            for (Entry<Pattern, String> entry : patterns.entrySet()) {
                Pattern pattern = entry.getKey();
                String newName = entry.getValue();
                Matcher matcher = pattern.matcher(content);
                content = matcher.replaceAll(newName);
            }
            script.setContent(content);

            // no-need to go deeper so we can return false here
            return false;
        } else if (target instanceof Transition) {
            Transition transition = (Transition) target;
            // convert dependencies
            transition.getDependencies().forEach(dep -> {
                dep.setVariableName(convertName(dep.getVariableName()));
            });
            // the transition contains a script so we need to go deeper : return true
            return true;
        } else if (target instanceof TaskDescriptor) {
            TaskDescriptor td = (TaskDescriptor) target;
            // convert predecessors
            td.setPredecessorNames(convert(td.getPredecessorNames()));
            // no-need to go deeper so we can return false here
            return false;
        }
        return true;
    }
}
