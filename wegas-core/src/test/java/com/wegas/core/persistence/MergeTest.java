/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.ejb.*;
import com.wegas.core.persistence.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import junit.framework.Assert;
import org.junit.Test;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class MergeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(MergeTest.class);

    @Test
    public void testTextDescriptorMerge() {

        TextDescriptor textD = new TextDescriptor();
        textD.setName("tScoped");
        textD.setScope(new TeamScope());
        textD.setDefaultInstance(new TextInstance());
        textD.getDefaultInstance().setValue("initialvalue");

        descriptorFacade.create(gameModel.getId(), textD);

        textD = (TextDescriptor) descriptorFacade.find(textD.getId());
        TextInstance defaultInstance = textD.getDefaultInstance();

        defaultInstance.setValue("newvalue");
        Assert.assertEquals("initialvalue", ((TextInstance) descriptorFacade.find(textD.getId()).getDefaultInstance()).getValue());
        Assert.assertEquals("newvalue", defaultInstance.getValue());

        descriptorFacade.update(textD.getId(), textD);
        textD = (TextDescriptor) descriptorFacade.find(textD.getId());
        defaultInstance = textD.getDefaultInstance();

        Assert.assertEquals("newvalue", defaultInstance.getValue());
    }

    @Test
    public void testListDescriptorMerge() {

        List<String> allowed = new ArrayList<>();

        ListDescriptor listD = new ListDescriptor();
        listD.setName("myList");
        listD.setScope(new TeamScope());
        listD.setDefaultInstance(new ListInstance());

        descriptorFacade.create(gameModel.getId(), listD);

        listD = (ListDescriptor) descriptorFacade.find(listD.getId());

        ListDescriptor newListD = new ListDescriptor();
        newListD.setVersion(listD.getVersion());
        newListD.setName("MyRenamedList");

        allowed.add("NumberDescriptor");
        allowed.add("StringDescriptor");
        allowed.add("TextDescriptor");
        newListD.setAllowedTypes(allowed);
        newListD.setAddShortcut("NumberDescriptor");

        descriptorFacade.update(listD.getId(), newListD);
        listD = (ListDescriptor) descriptorFacade.find(listD.getId());
        Assert.assertEquals(3, listD.getAllowedTypes().size());

        allowed.remove("StringDescriptor");
        newListD.setVersion(listD.getVersion());
        descriptorFacade.update(listD.getId(), newListD);
        listD = (ListDescriptor) descriptorFacade.find(listD.getId());
        Assert.assertEquals(2, listD.getAllowedTypes().size());

        try {
            allowed.remove("NumberDescriptor");
            newListD.setVersion(listD.getVersion());
            descriptorFacade.update(listD.getId(), newListD);
            Assert.fail("Shortcut incompatibility should raises error");
        } catch (Exception ex) {
            // expected
        }

        try {
            allowed.add("NumberDescriptor");
            newListD.setAddShortcut("BooleanDescriptor");
            descriptorFacade.update(listD.getId(), newListD);
            Assert.fail("Shortcut incompatibility should raises error");
        } catch (Exception ex) {
            // Excpected
        }

        newListD.setAddShortcut("TextDescriptor");
        descriptorFacade.update(listD.getId(), newListD);
    }

    @Test
    public void testObjectDescriptorMerge() {
        ObjectDescriptor objectD = new ObjectDescriptor();
        objectD.setName("tScoped");
        objectD.setScope(new TeamScope());
        objectD.setDefaultInstance(new ObjectInstance());
        objectD.setProperty("myProperty", "initialValue");
        ObjectInstance defaultInstance = objectD.getDefaultInstance();
        defaultInstance.setProperty("myInstanceProperty", "initialInstanceValue");

        descriptorFacade.create(gameModel.getId(), objectD);

        objectD = (ObjectDescriptor) descriptorFacade.find(objectD.getId());
        defaultInstance = objectD.getDefaultInstance();
        Assert.assertEquals("initialValue", objectD.getProperty("myProperty"));
        Assert.assertEquals("initialInstanceValue", defaultInstance.getProperty("myInstanceProperty"));

        objectD.setProperty("myProperty", "newValue");
        defaultInstance.setProperty("myInstanceProperty", "newInstanceValue");
        descriptorFacade.update(objectD.getId(), objectD);

        objectD = (ObjectDescriptor) descriptorFacade.find(objectD.getId());
        defaultInstance = objectD.getDefaultInstance();

        Assert.assertEquals("newValue", objectD.getProperty("myProperty"));
        Assert.assertEquals("newInstanceValue", defaultInstance.getProperty("myInstanceProperty"));
    }

    private Set<Field> getFields(Class klass) {

        Set<Field> fields = new HashSet<>();

        while (klass != null) {
            for (Field f : klass.getDeclaredFields()) {

                WegasEntityProperty a = f.getDeclaredAnnotation(WegasEntityProperty.class);
                if (a != null) {
                    fields.add(f);
                }
            }
            klass = klass.getSuperclass();
        }
        return fields;
    }

    @Test
    public void testGetterAndSetter() {
        Reflections reflections = new Reflections("com.wegas");
        Set<Class<? extends AbstractEntity>> sub = reflections.getSubTypesOf(AbstractEntity.class);

        List<Exception> exes = new ArrayList<>();

        for (Class<? extends AbstractEntity> entityClass : sub) {

            Set<Field> fields = this.getFields(entityClass);

            for (Field f : fields) {
                try {
                    PropertyDescriptor property = new PropertyDescriptor(f.getName(), f.getDeclaringClass());
                } catch (IntrospectionException ex) {
                    exes.add(ex);
                }
            }
        }

        for (Exception ex: exes){
            System.out.println(ex);
        }

        Assert.assertEquals(0, exes.size());
    }
}
