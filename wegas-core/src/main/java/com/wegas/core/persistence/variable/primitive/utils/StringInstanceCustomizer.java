/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive.utils;

import org.eclipse.persistence.config.DescriptorCustomizer;
import org.eclipse.persistence.descriptors.ClassDescriptor;
import org.eclipse.persistence.mappings.DatabaseMapping;
import org.eclipse.persistence.mappings.OneToOneMapping;

/**
 *
 * @author maxence
 */
public class StringInstanceCustomizer implements DescriptorCustomizer {

    @Override
    public void customize(ClassDescriptor descriptor) throws Exception {
        /*
         * TextInstance & StringInstance each owns a TranslatableContent.
         * VariableInstances and TranslatableContent have a @Version
         * optimistic locking policy. Tthe variableinstance one is cascaded.
         *
         * We do NOT want to cascade it to TranslatableContent.
         *
         * The solution is to customize the OneToOne mappings
         * from instances to TranslatableContant to make them not PrivateOwned
         */
        DatabaseMapping mapping = descriptor.getMappingForAttributeName("trValue");
        if (mapping instanceof OneToOneMapping) {
            OneToOneMapping o2o = (OneToOneMapping) mapping;
            o2o.setIsPrivateOwned(false);
        }
    }
}
