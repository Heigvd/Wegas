/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package ch.albasim.wegas.annotations;

import ch.albasim.wegas.annotations.ValueGenerator.Undefined;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A field annotated with WegasPropertyProperty will be taken into account while {@link com.wegas.core.merge.patch.WegasEntityPatch patching}
 *
 * @author maxence
 */
@Target(ElementType.FIELD)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface WegasEntityProperty {

    /**
     * Allow to define patch order (smaller first)
     *
     * @return patch order
     */
    int order() default 0;

    /**
     * Set to false to only include annotated field within the patch if the patch is recursive
     * (e.g. to exclude ListDescriptor children from patch)
     *
     * @return true if the field should be patch in all case, false if the field should only be patched with recursive patch
     */
    boolean includeByDefault() default true;

    /**
     * if set to true, patch will not set target property to null
     *
     * @return false is the field is nullable
     */
    boolean ignoreNull() default false;

    /**
     * Will only apply the patch if the target entity is the same as the entity one
     * (e.g. version)
     *
     * @return true if the patch should only applied if the target entity is the same as the entity one
     */
    boolean sameEntityOnly() default false;

    /**
     * Only merge property if the target property is null
     *
     * @return true to prevent overwriting non-null values
     */
    boolean initOnly() default false;

    /**
     * Is the property optional ?
     *
     * @return true if the property can be omitted
     */
    boolean optional() default true;

    /**
     * Can the property be null ?
     *
     * @return true if the property can be set to null
     */
    boolean nullable() default true;

    /**
     * postUpdate, preDestroy, postPersist callback
     *
     * @return callbacks to apply when updating the field
     */
    Class<? extends WegasCallback> callback() default EmptyCallback.class;

    /**
     * Under which visibility the OVERRIDE mode will be preserved ?
     * If the current visibility is not in this list, OVERRIDE is degraded to UPDATE
     *
     * @return list of visibility for which OVERRIDE mode is allowed to be propagated
     */
    // ModelScoped.Visibility[] cascadeOverride() default {ModelScoped.Visibility.INTERNAL, ModelScoped.Visibility.PROTECTED};
    ProtectionLevel protectionLevel() default ProtectionLevel.CASCADED;

    /**
     * Indicate if this property is "searchable".
     *
     * @return is the property searchable ?
     */
    boolean searchable() default false;

    /**
     * Editor's view.
     * @return 
     */
    View view() default @View(label = ""); // @TODO Remove default value

    /**
     * Override schema
     *
     * @return
     */
    Class<? extends JSONSchema> schema() default UndefinedSchema.class;

    /**
     * initial proposal
     * @return 
     */
    Class<? extends ValueGenerator> proposal() default Undefined.class;

    /**
     * set to true if the property is never serialized to the client
     * @return
     */
    boolean notSerialized() default false;
}
