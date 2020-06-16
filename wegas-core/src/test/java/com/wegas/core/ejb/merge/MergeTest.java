/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.merge;

import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.qos.logback.classic.Level;
import com.wegas.core.ejb.*;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.merge.utils.WegasEntitiesHelper;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.merge.utils.WegasFactory;
import com.wegas.core.merge.utils.WegasFieldProperties;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import org.junit.Assert;
import org.junit.Test;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence
 */
public class MergeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(MergeTest.class);
    private static final Reflections reflections;

    static {
        reflections = new Reflections("com.wegas");
    }

    //@BeforeClass
    public static void setLoggerLevels() {
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(ModelFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(WegasPatch.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptorFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptor.class)).setLevel(Level.DEBUG);

        ((ch.qos.logback.classic.Logger) logger).setLevel(Level.DEBUG);
    }

    @Test
    public void testTextDescriptorMerge() {
        TextDescriptor textD = new TextDescriptor();
        textD.setName("tScoped");
        textD.setScope(new TeamScope());
        textD.setDefaultInstance(new TextInstance());
        textD.getDefaultInstance().setValue("initialvalue");

        variableDescriptorFacade.create(gameModel.getId(), textD);

        textD = (TextDescriptor) variableDescriptorFacade.find(textD.getId());
        TextInstance defaultInstance = textD.getDefaultInstance();

        defaultInstance.setValue("newvalue");
        Assert.assertEquals("initialvalue", ((TextInstance) variableDescriptorFacade.find(textD.getId()).getDefaultInstance()).getTrValue().translateOrEmpty(gameModel));
        Assert.assertEquals("newvalue", defaultInstance.getTrValue().translateOrEmpty(gameModel));

        variableDescriptorFacade.update(textD.getId(), textD);
        textD = (TextDescriptor) variableDescriptorFacade.find(textD.getId());
        defaultInstance = textD.getDefaultInstance();

        Assert.assertEquals("newvalue", defaultInstance.getTrValue().translateOrEmpty(gameModel));
    }

    @Test
    public void testListDescriptorMerge() {

        Set<String> allowed = new HashSet<>();

        ListDescriptor listD = new ListDescriptor();
        listD.setName("myList");
        listD.setScope(new TeamScope());
        listD.setDefaultInstance(new ListInstance());

        variableDescriptorFacade.create(gameModel.getId(), listD);

        listD = (ListDescriptor) variableDescriptorFacade.find(listD.getId());

        ListDescriptor newListD = new ListDescriptor();
        newListD.setVersion(listD.getVersion());
        newListD.setName("MyRenamedList");
        newListD.setDefaultInstance(new ListInstance());

        allowed.add("NumberDescriptor");
        allowed.add("StringDescriptor");
        allowed.add("TextDescriptor");
        newListD.setAllowedTypes(allowed);
        newListD.setAddShortcut("NumberDescriptor");

        variableDescriptorFacade.update(listD.getId(), newListD);
        listD = (ListDescriptor) variableDescriptorFacade.find(listD.getId());
        Assert.assertEquals(3, listD.getAllowedTypes().size());

        allowed.remove("StringDescriptor");
        newListD.setVersion(listD.getVersion());
        variableDescriptorFacade.update(listD.getId(), newListD);
        listD = (ListDescriptor) variableDescriptorFacade.find(listD.getId());
        Assert.assertEquals(2, listD.getAllowedTypes().size());

        try {
            allowed.remove("NumberDescriptor");
            newListD.setVersion(listD.getVersion());
            variableDescriptorFacade.update(listD.getId(), newListD);
            Assert.fail("Shortcut incompatibility should raises error");
        } catch (Exception ex) {
            // expected
        }

        try {
            allowed.add("NumberDescriptor");
            newListD.setAddShortcut("BooleanDescriptor");
            variableDescriptorFacade.update(listD.getId(), newListD);
            Assert.fail("Shortcut incompatibility should raises error");
        } catch (Exception ex) {
            // Excpected
        }

        newListD.setAddShortcut("TextDescriptor");
        variableDescriptorFacade.update(listD.getId(), newListD);
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

        variableDescriptorFacade.create(gameModel.getId(), objectD);

        objectD = (ObjectDescriptor) variableDescriptorFacade.find(objectD.getId());
        defaultInstance = objectD.getDefaultInstance();
        Assert.assertEquals("initialValue", objectD.getProperty("myProperty"));
        Assert.assertEquals("initialInstanceValue", defaultInstance.getProperty("myInstanceProperty"));

        objectD.setProperty("myProperty", "newValue");
        defaultInstance.setProperty("myInstanceProperty", "newInstanceValue");
        variableDescriptorFacade.update(objectD.getId(), objectD);

        objectD = (ObjectDescriptor) variableDescriptorFacade.find(objectD.getId());
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
        Set<Class<? extends AbstractEntity>> sub = reflections.getSubTypesOf(AbstractEntity.class);

        List<String> errors = new ArrayList<>();

        for (Class<? extends AbstractEntity> entityClass : sub) {

            Set<Field> fields = this.getFields(entityClass);

            for (Field f : fields) {
                try {
                    PropertyDescriptor property = new PropertyDescriptor(f.getName(), f.getDeclaringClass());
                } catch (IntrospectionException ex) {
                    errors.add("Class " + entityClass + "; Field: " + f + " -> " + ex);
                }
            }
        }

        for (String error : errors) {
            logger.error(error);
        }

        Assert.assertEquals(0, errors.size());
    }

    //@Test
    public void printEntityChildren() {
        Set<Class<? extends AbstractEntity>> sub = reflections.getSubTypesOf(AbstractEntity.class);

        for (Class<? extends AbstractEntity> klass : sub) {
            WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(klass);
            List<WegasFieldProperties> fields = entityIterator.getFields();

            List<WegasFieldProperties> children = new LinkedList<>();

            for (WegasFieldProperties field : fields) {
                if (field.getType() == WegasFieldProperties.FieldType.CHILDREN) {
                    children.add(field);
                }
            }

            if (children.size() > 0) {
                System.out.println("");
                System.out.println("Class " + klass.getSimpleName());
                for (WegasFieldProperties field : children) {
                    System.out.println(" * " + field.getField().getName() + " : " + field.getField().getType().getSimpleName());
                }
            }
        }
    }

    //@Test
    public void printEntity() {
        Set<Class<? extends Mergeable>> classes = reflections.getSubTypesOf(Mergeable.class);

        for (Class<? extends Mergeable> klass : classes) {
            WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(klass);
            WegasFactory factory = entityIterator.getFactory();
            List<WegasFieldProperties> fields = entityIterator.getFields();

            if (fields.size() > 0) {
                System.out.println("");
                System.out.println("Class " + klass.getSimpleName());
                System.out.println(" factory:" + factory);
                for (WegasFieldProperties field : fields) {
                    System.out.println(" * " + (field.isInherited() ? "inherited " : "") + field.getField().getName() + " : " + field.getField().getType().getSimpleName());
                }
            }
        }
    }
}
