/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import com.wegas.core.IndentLogger;
import com.wegas.core.exception.client.WegasConflictException;
import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public abstract class WegasPatch {

    protected final static IndentLogger logger = new IndentLogger(LoggerFactory.getLogger(WegasPatch.class));

    public static enum PatchMode {
        CREATE,
        DELETE,
        UPDATE,
        OVERRIDE,
        SKIP
    }

    protected Object identifier;

    protected Integer order;

    protected Method getter;

    protected Method setter;

    protected WegasCallback fieldCallback;

    protected List<Visibility> cascadeOverride = new ArrayList<>();

    protected boolean ignoreNull;
    protected boolean sameEntityOnly;
    protected boolean initOnly;
    protected boolean recursive;

    protected WegasPatch(Object identifier, Integer order,
            Method getter, Method setter,
            WegasCallback fieldCallback,
            boolean ignoreNull, boolean sameEntityOnly,
            boolean initOnly, boolean recursive,
            Visibility[] cascade) {
        this.identifier = identifier;
        this.order = order;
        this.getter = getter;
        this.setter = setter;
        this.fieldCallback = fieldCallback;
        this.ignoreNull = ignoreNull;
        this.sameEntityOnly = sameEntityOnly;
        this.initOnly = initOnly;
        this.recursive = recursive;

        for (Visibility v : cascade) {
            cascadeOverride.add(v);
        }

    }

    protected List<WegasCallback> getCallbacks(WegasCallback userCallback) {
        ArrayList<WegasCallback> cbs = new ArrayList<>();
        if (fieldCallback != null) {
            cbs.add(this.fieldCallback);
        }
        if (userCallback != null) {
            cbs.add(userCallback);
        }
        return cbs;
    }

    protected boolean shouldApplyPatch(AbstractEntity target, AbstractEntity reference) {
        return (!sameEntityOnly || target.equals(reference));
    }

    public Object getIdentifier() {
        return identifier;
    }

    public void setIdentifier(Object identifier) {
        this.identifier = identifier;
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public WegasCallback getUserCallback() {
        return fieldCallback;
    }

    public void setUserCallback(WegasCallback userCallback) {
        this.fieldCallback = userCallback;
    }

    public void apply(AbstractEntity target) {
        this.apply(target, null, PatchMode.UPDATE, null, null, null);
    }

    protected abstract LifecycleCollector apply(AbstractEntity target, WegasCallback callback, PatchMode parentMode, Visibility visibility, LifecycleCollector collector, Integer numPass);

    private PatchMode getWithParent(PatchMode parentMode, Visibility inheritedVisibility, Visibility visibility) {
        logger.debug("GET MODE (parentMode {}; inheritedV: {}, v: {}", parentMode, inheritedVisibility, visibility);
        PatchMode mode = PatchMode.UPDATE;
        if (visibility != null) {
            if (visibility.equals(Visibility.INTERNAL) || visibility.equals(Visibility.PROTECTED)) {
                // current entity has its own visibility which requires override mode
                mode = PatchMode.OVERRIDE;
            }
        } else {
            // parent request to override and cascading override mode is permitted
            if (parentMode.equals(PatchMode.OVERRIDE) && this.cascadeOverride.contains(inheritedVisibility)) {
                mode = PatchMode.OVERRIDE;
            }
        }

        return mode;
    }

    protected PatchMode getPatchMode(Object target, Object from, Object to, PatchMode parentMode, Visibility inheritedVisibility, Visibility visibility) {
        PatchMode mode;

        logger.info("Get MODE: target: {}; from: {}; to: {}; parentMode: {}; iV: {}; v: {}", target, from, to, parentMode, inheritedVisibility, visibility);
        /* 
         * Determine patch mode
         */
        if (PatchMode.DELETE.equals(parentMode)) {
            mode = PatchMode.DELETE;
        } else if (target == null) {
            if (to != null) {
                // CREATE
                mode = PatchMode.CREATE;

                // but skip PRIVATE visibility
                if (to instanceof ModelScoped) {
                    if (Visibility.PRIVATE.equals(((ModelScoped) to).getVisibility())) {
                        mode = PatchMode.SKIP;
                    }
                }
            } else {
                // should be DELETE but target does not exists
                mode = PatchMode.SKIP;
            }
        } else {
            if (from != null) {
                if (to == null) {
                    mode = PatchMode.DELETE;
                } else {
                    if (to instanceof ModelScoped && from instanceof ModelScoped) {
                        Visibility fromScope = ((ModelScoped) from).getVisibility();
                        Visibility toScope = ((ModelScoped) to).getVisibility();

                        if (from.equals(target)) {
                            // same entity 
                            mode = getWithParent(parentMode, inheritedVisibility, visibility);
                        } else {
                            if (toScope.equals(Visibility.PRIVATE)) {
                                // change from * to PRIVATE -> DELETE
                                mode = PatchMode.DELETE;
                            } else if (fromScope.equals(Visibility.PRIVATE)) {
                                // change from PRIVATE TO not private -> CREATE
                                mode = PatchMode.CREATE;
                            } else if (toScope.equals(fromScope)) {
                                // no change -> UPDATE
                                mode = getWithParent(parentMode, inheritedVisibility, visibility);
                            } else {
                                // change from not private to not private
                                mode = PatchMode.OVERRIDE;
                            }
                        }
                    } else {
                        mode = getWithParent(parentMode, inheritedVisibility, visibility);
                    }
                }
            } else {
                //should create but already exists !
                throw new WegasConflictException();
            }
        }

        return mode;
    }

    @Override
    public String toString() {
        return this.print(0).toString();
    }

    protected StringBuilder print(int ident) {
        StringBuilder sb = new StringBuilder();
        indent(sb, ident);
        sb.append("Patch ").append(this.getClass().getSimpleName()).append(" ").append(identifier);
        if (fieldCallback != null) {
            newLine(sb, ident);
            sb.append("FieldCallback").append(fieldCallback);
        }

        return sb;
    }

    protected void indent(StringBuilder sb, int ident) {
        for (int i = 0; i < ident; i++) {
            sb.append("  ");
        }
    }

    protected void newLine(StringBuilder sb, int ident) {
        sb.append("\n");
        this.indent(sb, ident);
    }

}
