/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import ch.qos.logback.classic.Level;
import com.wegas.core.Helper;
import com.wegas.core.ejb.*;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.merge.ejb.MergeFacade;
import com.wegas.core.merge.patch.WegasPatch;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;
import org.reflections.ReflectionUtils;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class MergeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(MergeTest.class);
    private static final Reflections reflections;

    static {
        reflections = new Reflections("com.wegas");
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(MergeFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(WegasPatch.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger(VariableDescriptorFacade.class)).setLevel(Level.DEBUG);
        ((ch.qos.logback.classic.Logger) logger).setLevel(Level.DEBUG);
    }

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
        newListD.setDefaultInstance(new ListInstance());

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

        for (Exception ex : exes) {
            System.out.println(ex);
        }

        Assert.assertEquals(0, exes.size());
    }

    private NumberDescriptor createNumberDescriptor(GameModel gameModel, DescriptorListI parent, String name, String label, Double min, Double max, Double defaultValue, Double... history) {
        NumberDescriptor desc = new NumberDescriptor();
        List<Double> hist = new ArrayList<>();
        for (Double h : history) {
            hist.add(h);
        }
        desc.setName(name);
        desc.setLabel(label);
        desc.setScope(new TeamScope());
        desc.setMinValue(min);
        desc.setMaxValue(max);
        desc.setDefaultInstance(new NumberInstance());
        desc.getDefaultInstance().setValue(defaultValue);
        desc.getDefaultInstance().setHistory(hist);

        if (parent == null) {
            descriptorFacade.create(gameModel.getId(), desc);
        } else {
            descriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    private StringDescriptor createString(GameModel gameModel, DescriptorListI parent, String name, String label, String value) {
        StringDescriptor desc = new StringDescriptor();
        desc.setDefaultInstance(new StringInstance());
        desc.setName(name);
        desc.setLabel(label);
        desc.getDefaultInstance().setValue(value);

        if (parent == null) {
            descriptorFacade.create(gameModel.getId(), desc);
        } else {
            descriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    private ListDescriptor createList(GameModel gameModel, DescriptorListI parent, String name, String label) {
        ListDescriptor desc = new ListDescriptor();
        desc.setDefaultInstance(new ListInstance());
        desc.setName(name);
        desc.setLabel(label);

        if (parent == null) {
            descriptorFacade.create(gameModel.getId(), desc);
        } else {
            descriptorFacade.createChild(parent.getId(), desc);
        }

        return desc;
    }

    @Test
    public void testModelise() throws NamingException {
        MergeFacade mergeFacade = Helper.lookupBy(MergeFacade.class);

        GameModel gameModel1 = new GameModel();
        gameModel1.setName("gamemodel #1");
        gameModelFacade.createWithDebugGame(gameModel1);

        GameModel gameModel2 = new GameModel();
        gameModel2.setName("gamemodel #2");
        gameModelFacade.createWithDebugGame(gameModel2);

        GameModel gameModel3 = new GameModel();
        gameModel3.setName("gamemodel #3");
        gameModelFacade.createWithDebugGame(gameModel3);

        ListDescriptor list1_1 = createList(gameModel1, null, "MyFirstFolder", "My First Folder");
        createNumberDescriptor(gameModel1, list1_1, "x", "X", 0.0, 100.0, 1.0, 1.1);
        createNumberDescriptor(gameModel1, list1_1, "y", "Y", 0.0, 100.0, 2.0, 2.1);
        createNumberDescriptor(gameModel1, list1_1, "z", "Z", 0.0, 100.0, 3.0, 3.1);
        createNumberDescriptor(gameModel1, list1_1, "t", "T", 0.0, 100.0, 4.0, 4.1);

        ListDescriptor list1_2 = createList(gameModel2, null, "MyFirstFolder", "My First Folder");
        createNumberDescriptor(gameModel2, list1_2, "x", "LABEL X", 0.0, 100.0, 1.0, 1.1, 1.2);
        createNumberDescriptor(gameModel2, list1_2, "y", "LABEL Y", 0.0, 100.0, 2.0, 2.1, 2.2);
        createNumberDescriptor(gameModel2, list1_2, "z", "LABEL Z", 0.0, 100.0, 3.0, 3.1, 3.2);
        createNumberDescriptor(gameModel2, list1_2, "t", "LABEL T", 0.0, 100.0, 4.0, 4.1, 4.2);

        createNumberDescriptor(gameModel3, null, "x", "LBL X", -100.0, 100.0, 1.5, 1.1, 1.2);
        createNumberDescriptor(gameModel3, null, "y", "LBL Y", -100.0, 100.0, 2.5, 2.1, 2.2);
        createNumberDescriptor(gameModel3, null, "z", "LBL Z", -100.0, 100.0, 3.5, 3.1, 3.2);
        createNumberDescriptor(gameModel3, null, "t", "LBL T", -100.0, 100.0, 4.5, 4.1, 4.2);

        gameModel1 = gameModelFacade.find(gameModel1.getId());
        gameModel2 = gameModelFacade.find(gameModel2.getId());
        gameModel3 = gameModelFacade.find(gameModel3.getId());

        List<GameModel> scenarios = new ArrayList<>();

        scenarios.add(gameModel1);
        scenarios.add(gameModel2);
        scenarios.add(gameModel3);

        GameModel model = mergeFacade.createGameModelModel(scenarios);

        List<VariableDescriptor> children = new ArrayList<>();
        children.addAll(model.getChildVariableDescriptors());

        while (children.size() > 0) {
            VariableDescriptor vd = children.remove(0);
            switch (vd.getName()) {
                case "x":
                    vd.setVisibility(ModelScoped.Visibility.INTERNAL);
                    break;
                case "y":
                    vd.setVisibility(ModelScoped.Visibility.PROTECTED);
                    break;
                case "z":
                    vd.setVisibility(ModelScoped.Visibility.INHERITED);
                    break;
                case "t":
                    vd.setVisibility(ModelScoped.Visibility.PRIVATE);
                    break;
                default:
            }

            logger.info("Vd {} -> {}", vd, vd.getVisibility());
            if (vd instanceof DescriptorListI) {
                children.addAll(((DescriptorListI) vd).getItems());
            }
        }

        mergeFacade.createModel(model, scenarios);



        logger.info("FINI");
    }

    //@Test
    public void printWegasEntity() {
        Set<Class<? extends AbstractEntity>> sub = reflections.getSubTypesOf(AbstractEntity.class);
        for (Class<? extends AbstractEntity> klass : sub) {
            if (!Modifier.isAbstract(klass.getModifiers())) {
                System.out.println("");
                System.out.println("Class " + klass.getSimpleName());
                Set<Field> allFields = ReflectionUtils.getAllFields(klass, ReflectionUtils.withAnnotation(WegasEntityProperty.class));
                for (Field field : allFields) {
                    System.out.println(" * " + field.getName() + " : " + field.getType().getSimpleName());
                }
            }
        }
    }

    //@Test
    public void printEntity() {
        Set<Class<? extends AbstractEntity>> sub = reflections.getSubTypesOf(AbstractEntity.class);

        for (Class<? extends AbstractEntity> klass : sub) {
            List<Field> fields = new ArrayList<>();
            for (Field field : klass.getDeclaredFields()) {
                if (field.getAnnotation(WegasEntityProperty.class) != null) {
                    fields.add(field);
                }
            }

            if (fields.size() > 0) {
                System.out.println("");
                System.out.println("Class " + klass.getSimpleName());
                for (Field field : fields) {
                    System.out.println(" * " + field.getName() + " : " + field.getType().getSimpleName());
                }
            }
        }
    }
}
