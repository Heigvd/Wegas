package com.wegas.core.persistence.variable.primitive.utils;

import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import org.eclipse.persistence.config.SessionCustomizer;
import org.eclipse.persistence.descriptors.ClassDescriptor;
import org.eclipse.persistence.mappings.DatabaseMapping;
import org.eclipse.persistence.mappings.OneToOneMapping;
import org.eclipse.persistence.sessions.Session;

/**
 *
 * @author maxence
 */
public class EclipselinkCustomizer implements SessionCustomizer {

    @Override
    public void customize(Session sn) throws Exception {
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
        Class[] classes = {TextInstance.class, StringInstance.class};

        for (Class klass : classes) {
            ClassDescriptor descriptor = sn.getDescriptor(klass);

            DatabaseMapping mapping = descriptor.getMappingForAttributeName("trValue");
            if (mapping instanceof OneToOneMapping) {
                OneToOneMapping o2o = (OneToOneMapping) mapping;
                o2o.setIsPrivateOwned(false);
            }
        }
    }

}
