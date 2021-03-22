/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.WegasCallback;
import com.github.difflib.algorithm.DiffException;
import com.github.difflib.text.DiffRow;
import com.github.difflib.text.DiffRowGenerator;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasWrappedException;
import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;
import java.util.Objects;

/**
 * Patch for primitive value.
 * <p>
 * There is two cases. First one patch an entity field with the help of getter and setter. The
 * second one patch a primitive within a collection or a map.
 *
 * @author maxence
 */
public final class WegasPrimitivePatch extends WegasPatch {

    private Object fromValue;
    private Object toValue;

    //private Mergeable toEntity;
    /**
     * patch through getter and setter or with add/remove callback ?
     */
    private boolean isField;

    /**
     *
     * @param identifier     primitive identified (field name or map key)
     * @param order          patch index
     * @param userCallback
     * @param entity         parent entity which owns the field (field case only)
     * @param getter         getter to fetch value from entity (field case only)
     * @param setter         setter to set the value in entity
     * @param fromValue      previous value
     * @param toValue        new value
     * @param ignoreNull     should ignore new null value ?
     * @param sameEntityOnly avoid patching another entity (toEntity must equals apply(target,...);
     * @param initOnly       only set if value to patch is null
     * @param cascade
     */
    /* package */ WegasPrimitivePatch(Object identifier, int order,
        WegasCallback userCallback, Mergeable entity,
        Method getter, Method setter, Object fromValue, Object toValue,
        boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
        ProtectionLevel protectionLevel) {
        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, false, protectionLevel);
        this.identifier = identifier;
        this.fromValue = fromValue;
        this.toValue = toValue;
        this.toEntity = entity;

        /**
         *
         */
        this.isField = this.setter != null;
    }

    @Override
    public LifecycleCollector apply(GameModel targetGameModel, Deque<Mergeable> ancestors, Object value, WegasCallback callback, PatchMode parentMode, ModelScoped.Visibility visibility, LifecycleCollector collector, Integer numPass, boolean bypassVisibility) {
        if (numPass < 2) {
            try {
                Mergeable parent = ancestors != null ? ancestors.peek() : null;

                if (!isField || shouldApplyPatch(parent, toEntity)) {
                    Object oldTargetValue;
                    if (isField) {
                        oldTargetValue = getter.invoke(parent);
                    } else {
                        oldTargetValue = value;
                    }
                    PatchMode myMode = this.updateOrOverride(visibility, null);
                    logger.trace("MyMode: {}", myMode);

                    //if (belongsToProtectedGameModel(targetEntity, bypassVisibility) && belongsToProtectedGameModel(, bypassVisibility) && tr ue){
                    // && visibility stands in protected world ?
                    //}
                    logger.trace("visibility: {}; cascade: {}", visibility, protectionLevel);

                    if (!initOnly || oldTargetValue == null) { // do no overwrite non-null value if initOnly is set
                        if (myMode.equals(PatchMode.OVERRIDE) || (Objects.equals(oldTargetValue, fromValue))) { // do not override user-change but in protected mode
                            if (!Helper.isProtected(protectionLevel, visibility) || !isProtected(null, ancestors, bypassVisibility)) { // prevent protected changes
                                if (!ignoreNull || toValue != null) {

                                    logger.debug("Apply {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                                    List<WegasCallback> callbacks = this.getCallbacks(callback);

                                    for (WegasCallback cb : callbacks) {
                                        cb.preUpdate(parent, toValue, identifier);
                                    }

                                    if (isField) {
                                        if (!parentMode.equals(PatchMode.DELETE)) { // skip delete mode
                                            logger.debug(" SET to {}", toValue);
                                            setter.invoke(parent, toValue);
                                        } else {
                                            logger.debug("SKIP MODIFICATION {} : DELETE", this);
                                        }
                                    } else {
                                        for (WegasCallback cb : callbacks) {
                                            Object key = null;

                                            if (oldTargetValue != null) {
                                                key = cb.remove(oldTargetValue, null, identifier);
                                            } else {
                                                key = identifier;
                                            }
                                            if (toValue != null) {
                                                cb.add(toValue, parent, key);
                                            }
                                        }
                                    }

                                    for (WegasCallback cb : callbacks) {
                                        cb.postUpdate(parent, toValue, identifier);
                                    }
                                } else {
                                    logger.debug("REJECT IGNORE NULL {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                                }
                            } else {
                                logger.debug("PROHIBITED CHANGE {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                            }
                        } else {
                            logger.debug("REJECT USER CHANGE {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                        }
                    } else {
                        logger.debug("REJECT NO RE-INIT {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                    }
                } else {
                    logger.debug("REJECT {}: SAME_ENTITY_ONLY FAILED {} ->  {}", this, parent, toEntity);
                }
            } catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
                Throwable cause = ex.getCause();
                if (cause instanceof WegasRuntimeException) {
                    throw (WegasRuntimeException) cause;
                } else {
                    throw new WegasWrappedException(cause != null ? cause : ex);
                }
            }
        }
        return collector;
    }

    @Override
    protected StringBuilder print(int indent) {
        StringBuilder sb = super.print(indent);
        sb.append(" from ").append(fromValue).append(" to ").append(toValue);
        return sb;
    }

    private String valuetoString(Object value) {
        if (value != null) {
            return value.toString();
        } else {
            return "";
        }
    }

    @Override
    protected PatchDiff buildDiff(boolean bypassVisibility) {
        if (Objects.equals(fromValue, toValue)
            || identifier.equals("version")
            || identifier.equals("refId")) {
            return null;
        } else {
            String from = valuetoString(fromValue);
            String to = valuetoString(toValue);
            if (from.equals(to)) {
                return null;
            } else {
                return new PrimitiveDiff(this.identifier.toString(), from, to);
            }
        }
    }

    public abstract static class Change {

    }

    public static class SideBySideChange extends Change {

        private final String oldValue;
        private final String newValue;

        public SideBySideChange(String oldValue, String newValue) {
            this.oldValue = oldValue;
            this.newValue = newValue;
        }

        public String getOldValue() {
            return oldValue;
        }

        public String getNewValue() {
            return newValue;
        }
    }

    public static class LineChange extends Change {

        private final int lineNumber;
        private final String content;
        private final String tag;

        public LineChange(int lineNumber, String content, DiffRow.Tag tag) {
            this.lineNumber = lineNumber;
            this.content = content;
            this.tag = tag.name();
        }

        public int getLineNumber() {
            return lineNumber;
        }

        public String getContent() {
            return content;
        }

        public String getTag(){
            return tag;
        }
    }

    public static class PrimitiveDiff extends PatchDiff {

        private static DiffRowGenerator generator = DiffRowGenerator.create()
            .showInlineDiffs(true)
            .inlineDiffByWord(true)
            .mergeOriginalRevised(true)
            .build();

        private final String title;

        private List<Change> changes;

        public List<Change> getChanges() {
            return changes;
        }

        public String getTitle() {
            return title;
        }

        public PrimitiveDiff(String identifier, String from, String to) {

            this.title = identifier;

            changes = new ArrayList<>();

            try {
                List<DiffRow> rows = generator.generateDiffRows(Arrays.asList(from.split("\\n")), Arrays.asList(to.split("\\n")));

                boolean skip = false;

                for (int i = 0; i < rows.size(); i++) {
                    DiffRow row = rows.get(i);
                    if (row.getTag() != DiffRow.Tag.EQUAL) {
                        changes.add(new LineChange(i, row.getOldLine(), row.getTag()));
                        skip = false;
                    } else if (!skip) {
                        changes.add(new LineChange(i, "[...]", row.getTag()));
                        skip = true;
                    }
                }
            } catch (DiffException ex) {
                this.changes.add(new SideBySideChange(from, to));
            }
        }
    }
}
