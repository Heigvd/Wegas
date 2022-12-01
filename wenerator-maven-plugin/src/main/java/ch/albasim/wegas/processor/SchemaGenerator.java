
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package ch.albasim.wegas.processor;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.JSONSchema;
import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.UndefinedSchema;
import ch.albasim.wegas.annotations.ValueGenerator;
import ch.albasim.wegas.annotations.ValueGenerator.Undefined;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import ch.albasim.wegas.annotations.processor.ClassDoc;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.common.reflect.TypeToken;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasWrappedException;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.editor.jsonschema.JSONArray;
import com.wegas.editor.jsonschema.JSONBoolean;
import com.wegas.editor.jsonschema.JSONExtendedSchema;
import com.wegas.editor.jsonschema.JSONIdentifier;
import com.wegas.editor.jsonschema.JSONNumber;
import com.wegas.editor.jsonschema.JSONObject;
import com.wegas.editor.jsonschema.JSONString;
import com.wegas.editor.jsonschema.JSONType;
import com.wegas.editor.jsonschema.JSONUnknown;
import com.wegas.editor.jsonschema.JSONWRef;
import com.wegas.editor.Schema;
import com.wegas.editor.Schemas;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.Visible;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;
import javax.json.Json;
import javax.json.JsonMergePatch;
import javax.json.JsonValue;
import net.jodah.typetools.TypeResolver;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;
import org.reflections.Reflections;

@Mojo(name = "wenerator", defaultPhase = LifecyclePhase.PROCESS_CLASSES, requiresDependencyResolution = ResolutionScope.COMPILE)
public class SchemaGenerator extends AbstractMojo {

    private static final ObjectMapper mapper = JacksonMapperProvider.getMapper().enable(
        SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS,
        SerializationFeature.INDENT_OUTPUT
    );

    private static final String STRIP_FROM = "/* STRIP FROM */";
    private static final String STRIP_TO = "/* STRIP TO */";

    private static final String EXPORT_TOSTRIP = STRIP_FROM + " export " + STRIP_TO;

    private static final TypeToken<Mergeable> MERGEABLE_TYPE = new TypeToken<>() {
    };

    private static final TypeToken<Collection<?>> COLLECTION_TYPE = new TypeToken<Collection<?>>() {
    };

    private static final TypeToken<Map<?, ?>> MAP_TYPE = new TypeToken<Map<?, ?>>() {
    };

    private final Class<? extends Mergeable>[] classFilter;

    /**
     * Generate files or not generate files
     */
    private boolean dryRun;
    /**
     * Location of the schemas.
     */
    @Parameter(property = "wenerator.output", required = true)
    private File moduleDirectory;

    private File srcDirectory;

    private File schemasDirectory;

    private File typingsDirectory;

    @Parameter(property = "wenerator.pkg", required = true)
    private String[] pkg;

    private final Map<String, String> tsInterfaces;
    private final Map<String, String> tsScriptableClasses;

    private final Map<String, String> tsScriptableDeclarations;

    // class to superclass and interfaces
    private final Map<String, List<String>> inheritance;

    // class to direct subclasses
    private final Map<String, List<String>> subclasses;

    private final List<String> inheritanceOrder;

    /**
     * full-concrete classes (atClass names)
     */
    private final List<String> concreteClasses;

    /**
     * Concreteable classes (atClass names)
     */
    private final List<String> concreteableClasses;

    /**
     * full-abstract classes (atClass names)
     */
    private final List<String> abstractClasses;

    private final Map<String, ClassDoc> javadoc;

    private final Map<Type, String> otherObjectsInterfaceTypeD = new HashMap<>();

    private final Map<Type, String> otherObjectsScriptableTypeD = new HashMap<>();

    private final Map<Type, JSONExtendedSchema> otherObjectsSchemas = new HashMap<>();

    public SchemaGenerator() {
        this(false);
    }

    private SchemaGenerator(boolean dryRun) {
        this(dryRun, (Class<? extends Mergeable>[]) null);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    private SchemaGenerator(boolean dryRun, Class<? extends Mergeable>... cf) {
        this.dryRun = dryRun;
        this.classFilter = cf;

        this.javadoc = this.loadJavaDocFromJSON();

        this.tsInterfaces = new HashMap<>();
        this.tsScriptableClasses = new HashMap<>();
        this.tsScriptableDeclarations = new HashMap<>();

        this.inheritance = new HashMap<>();
        this.subclasses = new HashMap<>();

        this.inheritanceOrder = new LinkedList<>();

        this.concreteClasses = new LinkedList<>();
        this.abstractClasses = new LinkedList<>();
        this.concreteableClasses = new LinkedList<>();
    }

    private void buildInheritanceOrder() {

        boolean touched = false;

        Map<String, List<String>> toProcess = new HashMap<>();
        toProcess.putAll(inheritance);

        do {
            touched = false;
            Iterator<Entry<String, List<String>>> iterator = toProcess.entrySet().iterator();
            while (iterator.hasNext()) {
                Entry<String, List<String>> next = iterator.next();
                String superName = next.getValue().get(0);
                int indexOf = inheritanceOrder.indexOf(superName);
                if (superName == null || indexOf >= 0) {
                    inheritanceOrder.add(indexOf + 1, next.getKey());
                    touched = true;
                    iterator.remove();
                }
            }
        } while (touched);
    }

    public List<JsonMergePatch> processSchemaAnnotation(JSONObject o, Schema... schemas) {
        List<JsonMergePatch> patches = new ArrayList<>();

        if (schemas != null) {
            for (Schema schema : schemas) {
                getLog().info("Override Schema for  " + (schema.property()));
                try {
                    JSONSchema val = schema.value().getDeclaredConstructor().newInstance();
                    injectView(val, schema.view(), null);

                    if (schema.merge()) {
                        // do not apply patch now
                        Config newConfig = new Config();
                        newConfig.getSchema().setProperty(schema.property(), val);

                        String jsonNewConfig = mapper.writeValueAsString(newConfig);
                        JsonValue readValue = Json.createReader(new StringReader(jsonNewConfig)).readValue();
                        JsonMergePatch createMergePatch = Json.createMergePatch(readValue);

                        patches.add(createMergePatch);
                    } else {
                        o.setProperty(schema.property(), val);
                    }
                } catch (InstantiationException | IllegalAccessException | IllegalArgumentException
                    | SecurityException | NoSuchMethodException | InvocationTargetException e) {
                    e.printStackTrace();
                    throw WegasErrorMessage.error("Failed to instantiate schema: " + schema);
                } catch (JsonProcessingException ex) {
                    throw WegasErrorMessage.error("Failed to serialise schema: " + schema);
                }
            }
        }
        return patches;
    }

    public Object patchSchema(JSONExtendedSchema o, Class<? extends JSONSchema> schema) {
        if (schema != null && !schema.equals(UndefinedSchema.class)) {
            try {
                JSONSchema val = schema.getDeclaredConstructor().newInstance();

                String jsonNewConfig = mapper.writeValueAsString(val);
                JsonValue readValue = Json.createReader(new StringReader(jsonNewConfig)).readValue();
                JsonMergePatch patch = Json.createMergePatch(readValue);

                String oString = mapper.writeValueAsString(o);
                JsonValue oValue = Json.createReader(new StringReader(oString)).readValue();

                JsonValue patched = patch.apply(oValue);
                return mapper.readValue(patched.toString(), Object.class);

            } catch (InstantiationException | IllegalAccessException | IllegalArgumentException
                | SecurityException | NoSuchMethodException | InvocationTargetException e) {
                e.printStackTrace();
                throw WegasErrorMessage.error("Failed to instantiate schema: " + schema);
            } catch (IOException e) {
                e.printStackTrace();
                throw WegasErrorMessage.error("Failed to serialise schema: " + schema);
            }
        }
        return o;
    }

    private void injectErrords(JSONSchema schema, List<Errored> erroreds) {
        if (erroreds != null && schema instanceof JSONExtendedSchema) {
            for (Errored e : erroreds) {
                ((JSONExtendedSchema) schema).addErrored(e);
            }
        }
    }

    private void injectVisible(JSONSchema schema, Visible visible) {
        if (schema instanceof JSONExtendedSchema && visible != null) {
            try {
                ((JSONExtendedSchema) schema).setVisible(visible.value().getDeclaredConstructor().newInstance());
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    /**
     * inject View into Schema
     */
    private void injectView(JSONSchema schema, View view, Boolean forceReadOnly) {
        if (view != null && schema instanceof JSONExtendedSchema) {
            try {
                CommonView v = view.value().getDeclaredConstructor().newInstance();

                if (!view.label().isEmpty()) {
                    v.setLabel(view.label());
                }
                v.setBorderTop(view.borderTop());
                v.setDescription(view.description());
                v.setLayout(view.layout());

                if (view.readOnly() || Boolean.TRUE.equals(forceReadOnly)) {
                    v.setReadOnly(true);
                }

                ((JSONExtendedSchema) schema).setFeatureLevel(view.featureLevel());
                ((JSONExtendedSchema) schema).setView(v);

                v.setIndex(view.index()); // TO REMOVE
                v.setFeatureLevel(view.featureLevel()); // TO REMOVE
                ((JSONExtendedSchema) schema).setIndex(view.index());
            } catch (InstantiationException | IllegalAccessException | IllegalArgumentException
                | SecurityException | NoSuchMethodException | InvocationTargetException e) {
                e.printStackTrace();
                throw WegasErrorMessage.error("Fails to inject " + view);
            }
        }
    }

    public JSONString getJSONClassName(Class<? extends Mergeable> klass) {
        JSONString atClass = new JSONString(false);

        String klName = Mergeable.getJSONClassName(klass);
        atClass.setConstant(klName);
        atClass.setView(new Hidden());

        return atClass;
    }

    private String getTsInterfaceName(String className, Map<String, String> genericity, String prefix) {
        try {
            Class<?> forName = Class.forName(className);
            if (Mergeable.class.isAssignableFrom(forName)) {
                return getTsInterfaceName((Class<? extends Mergeable>) forName, genericity, prefix);
            } else {
                throw WegasErrorMessage.error(className + " not instance of Mergeable");
            }
        } catch (ClassNotFoundException ex) {
            throw WegasErrorMessage.error(className + " not found");
        }
    }

    private String getTsInterfaceName(Class<? extends Mergeable> klass, Map<String, String> genericity, String prefix) {
        String tsName = prefix + Mergeable.getJSONClassName(klass);
        if (genericity != null && genericity.containsKey(tsName)) {
            return genericity.get(tsName);
        }
        return tsName;
    }

    /*private boolean matchClassFilter(Class<?> klass) {
        if (classFilter == null || this.classFilter.length == 0) {
            return true;
        }
        for (Class<? extends Mergeable> cf : classFilter) {
            if (cf.isAssignableFrom(klass)) {
                return true;
            }
        }
        return false;
    }*/
    /**
     * Guess property name based on the getter name.
     *
     * @param method
     *
     * @return
     */
    private String getPropertyName(Method method) {
        return Introspector.decapitalize(method.getName().replaceFirst("get", "").replaceFirst("is", ""));
    }

    private void generateInheritanceTable(WegasEntityFields wEF) {
        Class<? extends Mergeable> theClass = wEF.getTheClass();
        Class<?>[] interfaces = theClass.getInterfaces();

        List<String> superclasses = new ArrayList<>();

        String theClassName = Mergeable.getJSONClassName(theClass);

        if (!theClass.isInterface() && theClass.getSuperclass() != Object.class) {
            Class<?> superClass = theClass.getSuperclass();

            String superAtClass = Mergeable.getJSONClassName(superClass);
            superclasses.add(superAtClass);

            while (superClass != Object.class) {
                superAtClass = Mergeable.getJSONClassName(superClass);
                if (!subclasses.containsKey(superAtClass)) {
                    subclasses.put(superAtClass, new ArrayList<>());
                }
                subclasses.get(superAtClass).add("\"" + theClassName + "\"");
                superClass = superClass.getSuperclass();
            }
        } else {
            superclasses.add(null);
        }

        for (Class<?> iface : interfaces) {
            if (iface.getName().startsWith("com.wegas")) {
                superclasses.add(Mergeable.getJSONClassName(iface));
            }
        }

        if (dryRun) {
            getLog().info(theClass.getSimpleName() + ":" + superclasses);
        } else {
            inheritance.put(theClassName, superclasses);
        }
    }

    private String formatJSDoc(String javaDoc) {
        if (javaDoc != null && !javaDoc.isEmpty()) {
            return "/**\n"
                + javaDoc + "\n"
                + "*/\n";
        } else {
            return "";
        }
    }

    private Map<String, String> buildGenericityAndWriteSignature(Class<? extends Mergeable> c,
        String prefix, StringBuilder sb) {
        Map<String, String> genericity = new HashMap<>();
        // classname to paramter type map (eg. VariableInstance -> T)
        List<String> genericityOrder = new ArrayList<>();

        // collect type parameters
        if (c.getTypeParameters() != null) {
            for (Type t : c.getTypeParameters()) {
                String typeName = t.getTypeName();
                Type reified = TypeResolver.reify(t, c);
                String tsType = javaToTSType(reified, null, "S", this.otherObjectsScriptableTypeD);
                genericity.put(tsType, typeName);
                genericityOrder.add(tsType);
            }
        }

        // write to TS
        if (!genericity.isEmpty()) {
            sb.append("<");
            genericityOrder.forEach(k -> {
                sb.append(genericity.get(k)).append(" extends ").append(k);
                sb.append(" = ").append(k).append(",");
            });
            sb.deleteCharAt(sb.length() - 1);
            sb.append(">");
        }

        if (c.getSuperclass() != null) {
            if (c.getSuperclass() != Object.class) {
                sb.append(" extends ")
                    .append(getTsInterfaceName((Class<? extends Mergeable>) c.getSuperclass(), null, prefix));

                Type[] gTypes = c.getSuperclass().getTypeParameters();
                if (gTypes != null && gTypes.length > 0) {
                    sb.append("<");
                    Arrays.stream(gTypes).forEach(t -> {
                        sb.append(
                            javaToTSType(TypeResolver.reify(t, c), genericity, "S", this.otherObjectsScriptableTypeD)).append(",");
                    });
                    // delete last comma
                    sb.deleteCharAt(sb.length() - 1);
                    sb.append(">");
                }

            } else {
                // top level classes should always implement Mergeable
                sb.append(" extends " + prefix + "Mergeable");
            }
        }

        return genericity;
    }

    private void generateTsScriptableClass(WegasEntityFields wEF, Map<Method, WegasExtraProperty> extraProperties) {
        Class<? extends Mergeable> c = wEF.getTheClass();
        String atClass = Mergeable.getJSONClassName(c);

        String prefix = "S";

        String scriptableClassName = getTsInterfaceName(c, null, prefix);
        String interfaceName = getTsInterfaceName(c, null, "I");

        /*
         * Collect scriptable methods
         */
        Map<String, ScriptableMethod> allMethods = new HashMap<>();
        allMethods.putAll(Arrays.stream(c.getMethods())
            .filter(m -> m.isAnnotationPresent(Scriptable.class) && !m.isBridge())
            .collect(Collectors.toMap((Method m) -> m.getName(), ScriptableMethod::new)));

        /**
         * is abstract on the java side
         */
        boolean isAbstract = Modifier.isAbstract(c.getModifiers());

        /**
         * is not abstract on the java side, but requires the client to implements some methods
         */
        boolean requiresClientImplementation = !allMethods.isEmpty();

        boolean isTSAbstract = isAbstract || requiresClientImplementation;

        if (isAbstract) {
            abstractClasses.add(atClass);
        } else if (requiresClientImplementation) {
            concreteableClasses.add(atClass);
        } else {
            concreteClasses.add(atClass);
        }

        /*
         * Start code generation
         */
        StringBuilder implBuilder = new StringBuilder(); // .ts
        StringBuilder declBuilder = new StringBuilder(); // .d.ts

        ClassDoc jDoc = this.javadoc.get(c.getName());
        if (jDoc != null) {
            implBuilder.append(this.formatJSDoc(jDoc.getDoc()));
        }

        if (c.getTypeParameters() != null) {
            implBuilder.append("// @ts-ignore \n");
        }

        /*
         * such export is used to break the ambient context.
         * As useGlobalLibs.ts will inject this file we have to make it ambient later.
         * Surround this statement with special markdown.
         */
        implBuilder.append(STRIP_FROM).append(" export ").append(STRIP_TO);

        if (isTSAbstract) {
            implBuilder.append("abstract ");
        }

        implBuilder.append("class ").append(scriptableClassName);

        Map<String, String> genericity = this.buildGenericityAndWriteSignature(c, prefix, implBuilder);

        implBuilder.append(" {\n");

        // implementation and declaration diverge from this point
        declBuilder.append(implBuilder);

        // constructor
        declBuilder.append("  public constructor(client: WegasClient, entity: Readonly<" + interfaceName + ">)").append(";\n");

        implBuilder.append("  public constructor(protected client: WegasClient, protected entity: Readonly<" + interfaceName + ">)")
            .append(" {")
            .append(System.lineSeparator())
            .append("    super(client, entity);")
            .append(System.lineSeparator())
            .append("  }")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        /**
         * getEntity
         */
        declBuilder.append("  public getEntity() : Readonly<")
            .append(interfaceName).append(">;")
            .append(System.lineSeparator());

        implBuilder.append("  public getEntity() : Readonly<")
            .append(interfaceName).append("> {")
            .append(System.lineSeparator())
            .append("    return this.entity;")
            .append(System.lineSeparator())
            .append("  }")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        Map<String, String> getterImpl = new HashMap<>();
        Map<String, String> getterDecl = new HashMap<>();

        for (Entry<Method, WegasExtraProperty> extraPropertyEntry : extraProperties.entrySet()) {
            Method method = extraPropertyEntry.getKey();
            WegasExtraProperty annotation = extraPropertyEntry.getValue();
            String fieldName = annotation.name().length() > 0 ? annotation.name() : getPropertyName(method);;
            registerGetter(getterDecl,
                false,
                fieldName, method.getName(),
                c, method.getGenericReturnType(),
                method.isAnnotationPresent(Deprecated.class),
                annotation.optional(),
                annotation.nullable(),
                genericity);

            registerGetter(getterImpl,
                true,
                fieldName, method.getName(),
                c, method.getGenericReturnType(),
                method.isAnnotationPresent(Deprecated.class),
                annotation.optional(),
                annotation.nullable(),
                genericity);
        }

        wEF.getFields().stream()
            // keep only self declared ones
            .filter(f -> !f.isInherited() && !f.getAnnotation().notSerialized()).forEach(
            field -> {
                Method getter = field.getPropertyDescriptor().getReadMethod();

                registerGetter(getterDecl,
                    false,
                    field.getField().getName(), getter.getName(),
                    c, getter.getGenericReturnType(),
                    field.getField().isAnnotationPresent(Deprecated.class),
                    field.getAnnotation().optional(),
                    field.getAnnotation().nullable(),
                    genericity);

                registerGetter(getterImpl,
                    true,
                    field.getField().getName(), getter.getName(),
                    c, getter.getGenericReturnType(),
                    field.getField().isAnnotationPresent(Deprecated.class),
                    field.getAnnotation().optional(),
                    field.getAnnotation().nullable(),
                    genericity);
            });

        // hack: override AtClass typing
        getterDecl.put("getJSONClassName", "getJSONClassName() : " + interfaceName + "[\"@class\"];\n");
        getterImpl.put("getJSONClassName", "getJSONClassName() { return this.entity[\"@class\"];}\n");

        // write properties (ie. getters)
        for (Entry<String, String> entry : getterDecl.entrySet()) {
            declBuilder.append(entry.getValue());
        }
        for (Entry<String, String> entry : getterImpl.entrySet()) {
            implBuilder.append(entry.getValue());
        }

        /*
         * Process Scriptable methods
         */
        generateMethods(declBuilder, allMethods, c);
        generateMethods(implBuilder, allMethods, c);

        declBuilder.append("}\n");
        implBuilder.append("}\n");

        if (dryRun) {
            getLog().info(c.getSimpleName() + ":");
            getLog().info(implBuilder);
        } else {
            tsScriptableDeclarations.put(atClass, declBuilder.toString());
            tsScriptableClasses.put(atClass, implBuilder.toString());
        }
    }

    /**
     * Generate interface and store its source code (as string) in tsInterfaces or
     * tsScriptableInterfaces
     *
     * @param wEF
     * @param extraProperties
     */
    private void generateTsInterface(WegasEntityFields wEF, Map<Method, WegasExtraProperty> extraProperties) {
        Class<? extends Mergeable> c = wEF.getTheClass();
        String atClass = Mergeable.getJSONClassName(c);

        boolean isAbstract = Modifier.isAbstract(c.getModifiers());

        StringBuilder sb = new StringBuilder();
        String prefix = "I";

        ClassDoc jDoc = this.javadoc.get(c.getName());
        if (jDoc != null) {
            sb.append(this.formatJSDoc(jDoc.getDoc()));
        }


        /*
         * such export is used to break the ambient context.
         * As useGlobalLibs.ts will inject this file we have to make it ambient later.
         * Surround this statement with special markdown.
         */
        sb.append(STRIP_FROM).append(" export ").append(STRIP_TO)
            .append("interface ").append(getTsInterfaceName(c, null, prefix));
        // classname to paramter type map (eg. VariableInstance -> T)
        Map<String, String> genericity = new HashMap<>();
        List<String> genericityOrder = new ArrayList<>();

        if (c.getTypeParameters() != null) {
            for (Type t : c.getTypeParameters()) {
                String typeName = t.getTypeName();
                Type reified = TypeResolver.reify(t, c);
                String tsType = javaToTSType(reified, null, "I", this.otherObjectsInterfaceTypeD);
                genericity.put(tsType, typeName);
                genericityOrder.add(tsType);
            }
        }
        if (!genericity.isEmpty()) {
            sb.append("<");
            genericityOrder.forEach(k -> {
                sb.append(genericity.get(k)).append(" extends ").append(k);
                sb.append(" = ").append(k).append(",");
            });
            sb.deleteCharAt(sb.length() - 1);
            sb.append(">");
        }

        if (c.getSuperclass() != null) {
            if (c.getSuperclass() != Object.class) {
                sb.append(" extends ");
                sb.append(getTsInterfaceName((Class<? extends Mergeable>) c.getSuperclass(), null, prefix));

                Type[] gTypes = c.getSuperclass().getTypeParameters();
                if (gTypes != null && gTypes.length > 0) {
                    sb.append("<");
                    Arrays.stream(gTypes).forEach(t -> {
                        sb.append(javaToTSType(TypeResolver.reify(t, c), genericity, "I", this.otherObjectsInterfaceTypeD)).append(",");
                    });
                    sb.deleteCharAt(sb.length() - 1);
                    sb.append(">");
                }
            } else {
                sb.append(" extends " + prefix + "Mergeable");
            }
        }
        sb.append(" {\n");

        Map<String, String> properties = new HashMap<>();

        for (Entry<Method, WegasExtraProperty> extraPropertyEntry : extraProperties.entrySet()) {
            Method method = extraPropertyEntry.getKey();
            WegasExtraProperty annotation = extraPropertyEntry.getValue();
            String name = annotation.name().length() > 0 ? annotation.name() : getPropertyName(method);
            Type returnType = method.getGenericReturnType();

            registerProperty(properties, name, c, returnType,
                true /* extra properties are always readonly */,
                annotation.optional(),
                annotation.nullable(),
                false,
                genericity);
        }

        List<String> allAtClass = new ArrayList<>();
        if (!isAbstract) {
            // use this at class for concrete classes
            allAtClass.add("\"" + atClass + "\"");
        }

        if (subclasses.containsKey(atClass)) {
            allAtClass.addAll(subclasses.get(atClass));
        }

        properties.put("@class", "  readonly '@class':" + String.join(" | ", allAtClass) + "\n");

        /*if (isAbstract) {
            // @class hack: string for abstract classes
            properties.put("@class", "  readonly '@class': string;\n");
        } else {
            // @class hack: constant value for concrete classes
            properties.put("@class", "  readonly '@class': '" + atClass + "';\n");
        }*/
        wEF.getFields().stream()
            // keep only self declared ones
            .filter(f -> !f.isInherited() && !f.getAnnotation().notSerialized()).forEach(field -> {
            Type returnType = field.getPropertyDescriptor().getReadMethod().getGenericReturnType();
            registerProperty(properties, field.getField().getName(), c,
                returnType, field.getAnnotation().initOnly(),
                field.getAnnotation().optional(),
                field.getAnnotation().nullable(),
                field.getField().isAnnotationPresent(Deprecated.class),
                genericity);
        });

        for (Entry<String, String> entry : properties.entrySet()) {
            sb.append(entry.getValue());
        }

        sb.append("}\n");

        if (dryRun) {
            getLog().info(c.getSimpleName() + ":");
            getLog().info(sb);
        } else {
            String iName = getTsInterfaceName(c, null, prefix);
            String iContent = "/*\n * " + iName + "\n */\n" + sb + "\n";
            tsInterfaces.put(atClass, iContent);
        }
    }

    /**
     * Add a property to TS interface
     *
     * @param properties
     * @param name
     * @param c
     * @param returnType
     * @param readOnly
     * @param optional
     * @param nullable
     * @param deprecated
     * @param genericity
     */
    private void registerProperty(Map<String, String> properties,
        String name, Class<? extends Mergeable> c,
        Type returnType,
        boolean readOnly,
        boolean optional,
        boolean nullable,
        boolean deprecated,
        Map<String, String> genericity) {
        Type reified = TypeResolver.reify(returnType, c);
        String tsType = javaToTSType(reified, genericity, "I", this.otherObjectsInterfaceTypeD);
        if (genericity.containsKey(tsType)) {
            tsType = genericity.get(tsType);
        }

        String property = "  ";
        if (deprecated) {
            property += "/* @deprecated */\n  ";
        }
        ClassDoc classDoc = this.javadoc.get(c.getName());

        if (classDoc != null) {
            String fDoc = classDoc.getFields().get(name);

            if (fDoc != null) {
                property += this.formatJSDoc(fDoc);
            }
        } else {
            getLog().warn("No JavaDoc for class " + c);
        }

        if (readOnly) {
            property += "readonly ";
        }

        if (!name.matches("^[a-zA-Z_][a-zA-Z0-9_]+$")) {
            // should quote property name !
            property += "\"" + name + "\"";
        } else {
            property += name;
        }

        if (optional) {
            property += "?";
        }

        property += ": " + tsType;
        if (nullable) {
            property += " | null";
        }

        property += ";\n";
        properties.put(name, property);
    }

    private void registerGetter(Map<String, String> properties,
        boolean generateImplementation,
        String fieldName,
        String methodName,
        Class<? extends Mergeable> c,
        Type returnType,
        boolean deprecated,
        boolean optional,
        boolean nullable,
        Map<String, String> genericity) {

        Type reified = TypeResolver.reify(returnType, c);
        String tsType = javaToTSType(reified, genericity, "S", this.otherObjectsScriptableTypeD);
        if (genericity.containsKey(tsType)) {
            tsType = genericity.get(tsType);
        }

        if (optional) {
            tsType += " | undefined";
        }

        if (nullable) {
            tsType += " | null";
        }

        String method = "  ";
        if (deprecated) {
            method += "/* @deprecated */\n  ";
        }
        ClassDoc classDoc = this.javadoc.get(c.getName());

        if (classDoc != null) {
            String fDoc = classDoc.getFields().get(fieldName);

            if (fDoc != null) {
                method += this.formatJSDoc(fDoc);
            }
        } else {
            getLog().warn("No JavaDoc for class " + c);
        }

        method += methodName;

        method += "()";

        if (!generateImplementation) {
            // may be commented out for testing purpose
            // adding typings to implementations may leand to conflictual definition as
            // ts is better than wenerator to resolve inherited types
            method += ":" + tsType + " ";
        }

        if (generateImplementation) {
            String iProp = "this.entity"
                + (fieldName.matches("^[a-zA-Z_][a-zA-Z0-9_]+$")
                ? "." + fieldName : "[\"" + fieldName + "\"]");

            if (isMergeable(reified) || isCollectionOfMergeable(reified) || isMapOfMergeable(reified)) {
                method += "{ return this.client.instantiate(" + iProp + "); }";
            } else {
                method += "{ return " + iProp + "; }";
            }
        } else {
            method += ";";
        }

        method += "\n";

        properties.put(methodName, method);
    }

    /**
     * Go through super method implementation to fetch a specific annotation
     *
     * @param <T>
     * @param m
     * @param annotationClass
     *
     * @return
     */
    private <T extends Annotation> T getFirstAnnotationInHierarchy(Method m, Class<T> annotationClass) {
        Deque<Class<?>> queue = new LinkedList<>();
        queue.add(m.getDeclaringClass());

        while (!queue.isEmpty()) {
            Class<?> klass = queue.removeFirst();
            try {
                Method method = klass.getMethod(m.getName(), m.getParameterTypes());
                if (method.getAnnotation(annotationClass) != null) {
                    return method.getAnnotation(annotationClass);
                }
            } catch (NoSuchMethodException | SecurityException ex) { // NOPMD
                // silent catch
            }

            queue.addAll(Arrays.asList(klass.getInterfaces()));

            if (klass.getSuperclass() != null) {
                queue.addLast(klass.getSuperclass());
            }

        }

        return null;
    }

    private void writeInheritanceToFile() {
        StringBuilder sb = new StringBuilder("{\n");

        sb.append(inheritance.entrySet().stream().map((e) -> {
            String list = e.getValue().stream().map(item -> "\"" + item + "\"")
                .collect(Collectors.joining(","));
            return "\"" + e.getKey() + "\": [" + list + "]";
        }).collect(Collectors.joining(",\n")));

        sb.append("\n}");

        try (BufferedWriter writer = Files.newBufferedWriter(Path.of(typingsDirectory.getAbsolutePath(), "Inheritance.json"))) {
            writer.write(sb.toString());
        } catch (IOException ex) {
            throw new WegasWrappedException(ex);
        }
    }

    private void writeInterfaces(StringBuilder sb, Map<String, String> interfaces,
        Map<Type, String> otherObjectsTypeD) {
        for (String name : inheritanceOrder) {
            String iface = interfaces.get(name);
            if (iface != null) {
                sb.append(iface);
            } else {
                getLog().error(name + " has no interface");
            }
        }

        otherObjectsTypeD.forEach((klass, typeDef) -> {
            sb.append("/*\n * ").append(((Class) klass).getSimpleName()).append("\n */\n");
            sb.append(typeDef).append("\n");
        });
    }

    private void writeInterfacesToFile(File folder, StringBuilder sb, String fileName) {
        try (BufferedWriter writer = Files.newBufferedWriter(Path.of(folder.getAbsolutePath(), fileName))) {
            writer.write(sb.toString());
        } catch (IOException ex) {
            getLog().error("Failed to write " + fileName + " in " + folder.getAbsolutePath(), ex);
        }
    }

    private void writeMergeableInterface(StringBuilder sb) {
        sb.append("\n/*\n"
            + " * IMergeable\n"
            + " */\n"
            + EXPORT_TOSTRIP
            + " interface IMergeable {\n"
            + "  readonly \"@class\": keyof WegasClassNamesAndClasses;\n"
            + "  refId?: string;\n"
            + "  readonly parentType?: string;\n"
            + "  readonly parentId?: number;\n"
            + "}\n");
    }

    private void writeScriptableMergeable(StringBuilder sb) {
        sb.append("\n/*\n"
            + " * SMergeable\n"
            + " */\n"
            + "export abstract class SMergeable {\n"
            + "  constructor(protected client:WegasClient, protected entity: IMergeable){}\n"
            + "  getEntity() { return this.entity; }\n"
            + "  getJSONClassName() { return this.entity[\"@class\"] }\n"
            + "  getRefId() { return this.entity.refId }\n"
            + "  getParentType() { return this.entity.parentType; }\n"
            + "  getParentId() { return this.entity.parentId; }\n"
            + "}\n");
    }

    private void writeScriptableMergeableDecl(StringBuilder sb) {
        sb.append("\n/*\n"
            + " * SMergeable\n"
            + " */\n"
            + EXPORT_TOSTRIP + " abstract class SMergeable {\n"
            + "  constructor(client:WegasClient, entity: IMergeable);\n"
            + "  getEntity() : IMergeable;\n"
            + "  getJSONClassName() : IMergeable[\"@class\"];\n"
            + "  getRefId() : IMergeable[\"refId\"];\n"
            + "  getParentType() : IMergeable[\"parentType\"];\n"
            + "  getParentId() : IMergeable[\"parentId\"];\n"
            + "}\n");
    }

    private void writeTsInterfacesToFile() {
        StringBuilder sb = new StringBuilder();
        ArrayList<String> intKeys = new ArrayList<String>(tsInterfaces.keySet());

        //Avoid ts and linter error for unused variable when the module imported (happends with ununes templates)
        sb.append("/* tslint:disable:no-unused-variable */")
            .append(System.lineSeparator())
            .append("// @ts-nocheck")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

//        sb.append("/**\n" + " * Remove specified keys.\n" + " */\n" + "type WithoutAtClass<Type> = Pick<\n"
//            + "    Type,\n" + "    Exclude<keyof Type, '@class'>\n" + ">;");
        writeMergeableInterface(sb);

        /**
         * Creating ts interface linking real classes and stringified classes
         */
        sb.append(System.lineSeparator()).append(EXPORT_TOSTRIP + " interface WegasClassNamesAndClasses {");
        intKeys.forEach(key -> {
            sb.append(System.lineSeparator())
                .append("  " + key + " : I" + key + ";");
        });
        sb.append(System.lineSeparator())
            .append("}")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        /**
         * Creating ts type allowing every generated WegasEntities as string
         */
        sb.append(EXPORT_TOSTRIP + " type WegasClassNames = keyof WegasClassNamesAndClasses;")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        /**
         * TS interfaces with mandatory id
         */
        sb.append(System.lineSeparator()).append(EXPORT_TOSTRIP + " interface WithId {id: number};");
        intKeys.forEach(key -> {
            sb.append(System.lineSeparator())
                .append(EXPORT_TOSTRIP).append(" type I")
                .append(key)
                .append("WithId  = I")
                .append(key)
                .append(" & WithId;");
        });

        writeInterfaces(sb, tsInterfaces, this.otherObjectsInterfaceTypeD);

        writeInterfacesToFile(typingsDirectory, sb, "WegasEntities.ts");
    }

    private void writeClassNameMapDecl(List<String> atClasses, String name, StringBuilder sb) {
        sb.append(EXPORT_TOSTRIP).append(" interface ").append(name).append(" {");

        atClasses.forEach(key -> {
            sb.append(System.lineSeparator())
                .append("  " + key + " : S" + key + ",");
        });
        sb.append(System.lineSeparator())
            .append("}")
            .append(System.lineSeparator())
            .append(System.lineSeparator());
    }

    private void writeClassNameMap(List<String> atClasses, String name, StringBuilder sb) {
        sb.append("export const map").append(name).append(" = {");

        atClasses.forEach(key -> {
            sb.append(System.lineSeparator())
                .append("  " + key + " : S" + key + ",");
        });
        sb.append(System.lineSeparator())
            .append("};")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        sb.append("export type ").append(name).append(" = typeof map").append(name)
            .append(";")
            .append(System.lineSeparator())
            .append(System.lineSeparator());
    }

    private void writeTsScriptableClassesToFile() {
        StringBuilder implBuilder = new StringBuilder();

        StringBuilder declBuilder = new StringBuilder();

        ArrayList<String> intKeys = new ArrayList<String>(tsScriptableClasses.keySet());

        /*
         * such import break the ambient context.
         * As useGlobalLibs.ts will inject this file we have to make it ambient later.
         * Surround this statement with special markdown.
         */
        implBuilder.append(STRIP_FROM)
            .append("import { WegasClient } from '../../src';")
            .append(STRIP_TO).append(System.lineSeparator());

        implBuilder.append(STRIP_FROM).append("import {")
            .append("  IMergeable,");

        tsInterfaces.forEach((tsName, _value) -> {
            implBuilder.append("I").append(tsName).append(" , ");
        });

        // delete last comma and space
        implBuilder.deleteCharAt(implBuilder.length() - 1);
        implBuilder.deleteCharAt(implBuilder.length() - 1);

        /**
         * Declaration starts to differ
         */
        // declBuilder.append(implBuilder);

        implBuilder.append("} from '../..';").append(STRIP_TO)
            .append(System.lineSeparator());
        //declBuilder.append("} from './WegasEntities';").append(STRIP_TO)
        //    .append(System.lineSeparator());

        /**
         * Creating top-level SMergeable class
         */
        writeScriptableMergeableDecl(declBuilder);
        writeScriptableMergeable(implBuilder);

        /**
         * Creating ts interface linking real classes and stringified classes
         */
        implBuilder.append(EXPORT_TOSTRIP).append("interface WegasEntitiesNamesAndClasses {");
        intKeys.forEach(key -> {
            String sKey = "S" + key;
            implBuilder.append(System.lineSeparator())
                .append("  " + sKey + " : " + sKey + ";")
                .append(System.lineSeparator())
                .append("  '" + sKey + "[]' : " + sKey + "[];")
                .append("  'Readonly<" + sKey + ">' : Readonly<" + sKey + ">;")
                .append(System.lineSeparator())
                .append("  'Readonly<" + sKey + "[]>' : Readonly<" + sKey + "[]>;");
        });

        implBuilder.append(System.lineSeparator())
            .append("}")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        declBuilder.append(EXPORT_TOSTRIP).append("interface WegasEntitiesNamesAndClasses {");
        intKeys.forEach(key -> {
            String sKey = "S" + key;
            declBuilder.append(System.lineSeparator())
                .append("  " + sKey + " : " + sKey + ";")
                .append(System.lineSeparator())
                .append("  '" + sKey + "[]' : " + sKey + "[];")
                .append("  'Readonly<" + sKey + ">' : Readonly<" + sKey + ">;")
                .append(System.lineSeparator())
                .append("  'Readonly<" + sKey + "[]>' : Readonly<" + sKey + "[]>;");
        });

        declBuilder.append(System.lineSeparator())
            .append("}")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        writeInterfaces(declBuilder, tsScriptableDeclarations, this.otherObjectsScriptableTypeD);
        writeInterfaces(implBuilder, tsScriptableClasses, this.otherObjectsScriptableTypeD);

        this.writeClassNameMapDecl(abstractClasses, "AtClassToAbstractTypes", declBuilder);
        this.writeClassNameMap(abstractClasses, "AtClassToAbstractClasses", implBuilder);
        this.writeClassNameMapDecl(abstractClasses, "AtClassToAbstractTypes", implBuilder);

        this.writeClassNameMapDecl(concreteableClasses, "AtClassToConcrtetableTypes", declBuilder);
        this.writeClassNameMap(concreteableClasses, "AtClassToConcrtetableClasses", implBuilder);
        this.writeClassNameMapDecl(concreteableClasses, "AtClassToConcrtetableTypes", implBuilder);

        this.writeClassNameMapDecl(concreteClasses, "AtClassToConcreteTypes", declBuilder);
        this.writeClassNameMap(concreteClasses, "AtClassToConcreteClasses", implBuilder);
        this.writeClassNameMapDecl(concreteClasses, "AtClassToConcreteTypes", implBuilder);

        implBuilder.append(EXPORT_TOSTRIP)
            .append(" type AtClassToClasses = "
                + "AtClassToAbstractClasses & AtClassToConcrtetableClasses & AtClassToConcreteClasses;")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        implBuilder.append(EXPORT_TOSTRIP)
            .append(" type WegasClassNameAndScriptableTypes = "
                + "AtClassToAbstractTypes & AtClassToConcrtetableTypes & AtClassToConcreteTypes;")
            .append(System.lineSeparator())
            .append(System.lineSeparator());


        /**
         * Creating ts interface linking WegasEntites @class and ScriptableWegasEntites classes
         */
        declBuilder.append(EXPORT_TOSTRIP)
            .append(" type WegasClassNameAndScriptableTypes = "
                + "AtClassToAbstractTypes & AtClassToConcrtetableTypes & AtClassToConcreteTypes;")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        /**
         * Creating ts type allowing every generated WegasEntities as string
         */
        declBuilder.append(EXPORT_TOSTRIP)
            .append(" type ScriptableInterfaceName = keyof WegasEntitiesNamesAndClasses;")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        /**
         * Creating ts type allowing every generated WegasEntities
         */
        declBuilder.append(EXPORT_TOSTRIP)
            .append(" type ScriptableInterface = WegasEntitiesNamesAndClasses[ScriptableInterfaceName];")
            .append(System.lineSeparator())
            .append(System.lineSeparator());

        /**
         * Creating all interfaces with callable methods for scripts
         */
        writeInterfacesToFile(typingsDirectory, declBuilder, "WegasScriptableEntities.d.ts.mlib");
        writeInterfacesToFile(srcDirectory, implBuilder, "WegasScriptableEntities.ts");
    }

    private void generateMethods(StringBuilder builder,
        Map<String, ScriptableMethod> methods, Class<? extends Mergeable> klass) {
        methods.forEach((k, v) -> {
            Method method = v.m;
            String methodName = method.getName();

            ClassDoc cDoc = this.javadoc.get(klass.getName());

            if (cDoc != null) {
                builder.append(System.lineSeparator())
                    .append(System.lineSeparator())
                    .append(this.formatJSDoc(cDoc.getMethods().get(methodName)));
            }

            builder.append("  public abstract ");
            builder.append(methodName).append("(");
            Arrays.stream(method.getParameters()).forEach(p -> {
                Type type = p.getParameterizedType();
                Type reified = TypeResolver.reify(type, method.getDeclaringClass());
                builder.append(p.getName()).append(": Readonly<").append(javaToTSType(reified, null, "S", this.otherObjectsScriptableTypeD));
                builder.append(">, ");
            });
            builder.append(")");

            Type genericReturnType = method.getGenericReturnType();
            Type reified = TypeResolver.reify(genericReturnType, klass);
            String tsReturnType = javaToTSType(reified, null, "S", this.otherObjectsScriptableTypeD);

            builder.append(" : Readonly<").append(tsReturnType).append(">");

            if (v.nullable) {
                builder.append(" | null");
            }

            builder.append(";").append(System.lineSeparator());
        });
    }

    @Override
    public void execute() throws MojoExecutionException {
        Set<Class<? extends Mergeable>> classes;

        if (!dryRun) {
            pkg = new String[]{"com.wegas"};
            classes = new Reflections((Object[]) pkg).getSubTypesOf(Mergeable.class);

            getLog().error(moduleDirectory.getAbsolutePath());

            if (moduleDirectory.isFile()) {
                throw new MojoExecutionException(srcDirectory.getAbsolutePath() + " is not a directory");
            }
            moduleDirectory.mkdirs();

            srcDirectory = new File(moduleDirectory, "src/generated");
            srcDirectory.mkdir();

            getLog().info("Writing sources to " + srcDirectory.getAbsolutePath());
            srcDirectory.mkdirs();
            schemasDirectory = new File(srcDirectory, "schemas");
            schemasDirectory.mkdir();

            typingsDirectory = new File(moduleDirectory, "typings");
            getLog().info("Writing types to " + typingsDirectory.getAbsolutePath());
            typingsDirectory.mkdirs();
        } else {
            getLog().info("DryRun: do not generate any files");
            if (this.classFilter != null) {
                classes = new HashSet<>(Arrays.asList(this.classFilter));
            } else {
                pkg = new String[]{"com.wegas"};
                classes = new Reflections((Object[]) pkg).getSubTypesOf(Mergeable.class);
            }
        }

        getLog().info("Mergeable Subtypes: " + classes.size());

        /*
         * Hold a reference to generated file names
         */
        Map<String, String> jsonBuiltFileNames = new HashMap<>();

        classes.stream()
            .filter(c -> !c.isAnonymousClass()).forEach(c -> {
            WegasEntityFields wEF = new WegasEntityFields(c);
            this.generateInheritanceTable(wEF);
        });

        classes.stream()
            // ignore classes the client dont need
            .filter(c -> !c.isAnonymousClass()).forEach(c -> {
            try {
                WegasEntityFields wEF = new WegasEntityFields(c);

                final Config config = new Config();
                Map<String, ScriptableMethod> allMethods = new HashMap<>();
                Map<String, ScriptableMethod> schemaMethods = config.getMethods();

                Map<Method, WegasExtraProperty> allExtraProperties = new HashMap<>();
                Map<Method, WegasExtraProperty> extraProperties = new HashMap<>();

                for (Method m : c.getMethods()) {
                    WegasExtraProperty annotation = this.getFirstAnnotationInHierarchy(m,
                        WegasExtraProperty.class);
                    if (annotation != null) {
                        allExtraProperties.put(m, annotation);
                        if (m.getDeclaringClass().equals(c)
                            || Arrays.asList(c.getInterfaces()).contains(m.getDeclaringClass())) {
                            extraProperties.put(m, annotation);
                        }
                    }
                }

                Arrays.stream(c.getMethods())
                    // brige: methods duplicated when return type is overloaded (see
                    // PrimitiveDesc.getValue)
                    .filter(m -> m.isAnnotationPresent(WegasExtraProperty.class) && !m.isBridge())
                    .collect(Collectors.toList());

                if (!c.isInterface()) {
                    /*
                     * Generate TS interface for classes only
                     */
                    this.generateTsInterface(wEF, extraProperties);
                    /*
                     * Generate TS interface for proxy classes
                     */
                    this.generateTsScriptableClass(wEF, extraProperties);

                }

                /*
                 * Process all public methods (including inherited ones)
                 */
                // abstract classes too ? restrict ton concretes ??
                allMethods.putAll(Arrays.stream(c.getMethods())
                    // brige: schemaMethods duplicated when return type is overloaded (see
                    // PrimitiveDesc.getValue)
                    .filter(m -> m.isAnnotationPresent(Scriptable.class) && !m.isBridge())
                    .collect(Collectors.toMap((Method m) -> m.getName(), ScriptableMethod::new)));

                // schema should only contains wysiwyg methods
                allMethods.forEach((k, v) -> {
                    if (v.m.getAnnotation(Scriptable.class).wysiwyg()) {
                        schemaMethods.put(k, v);
                    }
                });

                /**
                 * Generate JSON Schema : Process all fields (including inherited ones)
                 */
                if (!Modifier.isAbstract(c.getModifiers())) {
                    // Fill Schema but for concrete classes only
                    JSONObject jsonSchema = config.getSchema();
                    jsonSchema.setDescription(c.getName());

                    wEF.getFields().stream().filter(f -> !f.getAnnotation().notSerialized())
                        .forEach(field -> {
                            Type returnType = field.getPropertyDescriptor().getReadMethod()
                                .getGenericReturnType();
                            this.addSchemaProperty(jsonSchema, c, returnType,
                                field.getAnnotation().schema(), field.getPropertyDescriptor().getName(),
                                field.getAnnotation().view(), field.getErroreds(),
                                field.getField().getAnnotation(Visible.class),
                                field.getAnnotation().optional(),
                                field.getAnnotation().nullable(),
                                field.getAnnotation().proposal(),
                                field.getAnnotation().protectionLevel(),
                                null
                            );
                        });

                    for (Entry<Method, WegasExtraProperty> extraPropertyEntry : allExtraProperties.entrySet()) {
                        Method method = extraPropertyEntry.getKey();
                        WegasExtraProperty annotation = extraPropertyEntry.getValue();
                        String name = annotation.name().length() > 0 ? annotation.name()
                            : getPropertyName(method);
                        Type returnType = method.getGenericReturnType();

                        this.addSchemaProperty(jsonSchema, c, returnType,
                            annotation.schema(),
                            name, annotation.view(), null, null,
                            annotation.optional(), annotation.nullable(), annotation.proposal(),
                            ProtectionLevel.CASCADED,
                            true
                        );
                    }

                    // Override @class with one with default value
                    jsonSchema.setProperty("@class", getJSONClassName(c));

                    List<JsonMergePatch> patches = new ArrayList<>();
                    Schemas schemas = c.getAnnotation(Schemas.class);
                    if (schemas != null) {
                        patches.addAll(this.processSchemaAnnotation(jsonSchema, schemas.value()));
                    }

                    Schema schema = c.getAnnotation(Schema.class);
                    if (schema != null) {
                        patches.addAll(this.processSchemaAnnotation(jsonSchema, schema));
                    }

                    // Write
                    String jsonFileName = jsonFileName(c);

                    if (jsonBuiltFileNames.containsKey(jsonFileName)) {
                        // At that point seems we have duplicate "@class"
                        getLog().error("Duplicate file name " + jsonFileName + "classes "
                            + jsonBuiltFileNames.get(jsonFileName) + " <> " + c.getName());
                        return;
                    }
                    jsonBuiltFileNames.put(jsonFileName, wEF.getTheClass().getName());

                    if (!dryRun) {
                        try (BufferedWriter writer = Files.newBufferedWriter(Path.of(schemasDirectory.getAbsolutePath(), jsonFileName))) {
                            writer.write(configToString(config, patches));
                        } catch (IOException ex) {
                            getLog().error("Failed to write " + jsonFileName + " in " + schemasDirectory.getAbsolutePath(), ex);
                        }
                    } else {
                        getLog().info(jsonFileName);
                        getLog().info(configToString(config, patches));
                    }
                }
            } catch (NoClassDefFoundError nf) {
                getLog().warn("Can't read " + c.getName() + " - No Class Def found for " + nf.getMessage());
            }
        });
        otherObjectsSchemas.forEach((t, v) -> {
            getLog().info("Type " + t);
        });

        if (!dryRun) {
            buildInheritanceOrder();
            writeTsInterfacesToFile();
            writeTsScriptableClassesToFile();
            writeInheritanceToFile();
        }
    }

    private void addSchemaProperty(JSONObject jsonSchema,
        Class<? extends Mergeable> c,
        Type returnType,
        Class<? extends JSONSchema> schemaOverride,
        String name, View view, List<Errored> erroreds,
        Visible visible,
        boolean optional,
        boolean nullable,
        Class<? extends ValueGenerator> proposal,
        ProtectionLevel protectionLevel,
        Boolean readOnly) {

        JSONSchema prop;
        if (UndefinedSchema.class.isAssignableFrom(schemaOverride)) {
            Type reified = TypeResolver.reify(returnType, c);
            prop = javaToJSType(reified, nullable);
        } else {
            try {
                prop = schemaOverride.newInstance();
            } catch (InstantiationException | IllegalAccessException ex) {
                throw WegasErrorMessage.error("Fails to instantion overrinding schema");
            }
        }

        if (!optional && prop instanceof JSONExtendedSchema) {
            ((JSONExtendedSchema) prop).setRequired(true);
        }

        injectView(prop, view, readOnly);
        if (prop instanceof JSONExtendedSchema) {
            ((JSONExtendedSchema) prop).setProtectionLevel(protectionLevel);
        }
        injectErrords(prop, erroreds);
        injectVisible(prop, visible);
        if (proposal != null && !Undefined.class.equals(proposal)) {
            try {
                if (prop instanceof JSONExtendedSchema) {
                    ((JSONExtendedSchema) prop).setValue(proposal.newInstance().getValue());
                }
            } catch (InstantiationException | IllegalAccessException ex) {
                throw WegasErrorMessage.error("Error while generating initial proposal");
            }
        }
        jsonSchema.setProperty(name, prop);
    }

    /**
     * Serialise config and apply patches
     *
     * @param config
     * @param patches
     *
     * @return
     */
    private String configToString(Config config, List<JsonMergePatch> patches) {
        try {
            String jsonConfig = mapper.writeValueAsString(config);
            JsonValue value = Json.createReader(new StringReader(jsonConfig)).readValue();
            for (JsonMergePatch patch : patches) {
                value = patch.apply(value);
            }
            return prettyPrint(value);
        } catch (JsonProcessingException ex) {
            getLog().error("Failed to generate JSON", ex);
            return "ERROR, SHOULD CRASH";
        }
    }

    public static String prettyPrint(JsonValue json) {
        try {
            return mapper.writeValueAsString(mapper.readValue(json.toString(), Object.class));
        } catch (IOException ex) {
            throw WegasErrorMessage.error("Pretty print fails");
        }
    }

    private String jsonFileName(Class<? extends Mergeable> cls) {
        return this.baseFileName(cls) + ".json";
    }

    private String baseFileName(Class<? extends Mergeable> cls) {
        return Mergeable.getJSONClassName(cls);
    }

    /**
     * Convert primitive classes to Object classes
     *
     * @param klass any class
     *
     * @return an Object class
     */
    private Class<?> wrap(Class<?> klass) {
        if (klass.isPrimitive()) {
            if (klass.equals(void.class)) {
                return Void.class;
            } else if (klass.equals(boolean.class)) {
                return Boolean.class;
            } else if (klass.equals(byte.class)) {
                return Byte.class;
            } else if (klass.equals(short.class)) {
                return Short.class;
            } else if (klass.equals(char.class)) {
                return Character.class;
            } else if (klass.equals(int.class)) {
                return Integer.class;
            } else if (klass.equals(long.class)) {
                return Long.class;
            } else if (klass.equals(float.class)) {
                return Float.class;
            } else if (klass.equals(double.class)) {
                return Double.class;
            }
        }
        return klass;
    }

    private boolean isMergeable(Type type) {
        return MERGEABLE_TYPE.isSupertypeOf(type);
    }

    private boolean isCollectionOfMergeable(Type type) {
        if (COLLECTION_TYPE.isSupertypeOf(type)) { // List / Set
            Type[] types = ((ParameterizedType) type).getActualTypeArguments();
            return types.length == 1 && isMergeable(types[0]);
        }
        return false;
    }

    private boolean isMapOfMergeable(Type type) {
        if (MAP_TYPE.isSupertypeOf(type)) { // Dictionary
            Type[] types = ((ParameterizedType) type).getActualTypeArguments();
            // Type keyType = types[0];
            // Type valueType = types[1];
            return types.length == 2 && isMergeable(types[1]);
        }
        return false;
    }

    private boolean isCollection(Type type) {
        return COLLECTION_TYPE.isSupertypeOf(type);
    }

    private boolean isMap(Type type) {
        return MAP_TYPE.isSupertypeOf(type);
    }

    private String javaToTSType(Type type, Map<String, String> genericity, String prefix,
        Map<Type, String> otherObjectsTypeD) {
        if (type instanceof Class) {
            Class<?> returnType = wrap((Class<?>) type);
            if (Number.class.isAssignableFrom(returnType) || Calendar.class.isAssignableFrom(returnType)
                || Date.class.isAssignableFrom(returnType)) {
                return "number";
            } else if (String.class.isAssignableFrom(returnType)) {
                return "string";
            } else if (Boolean.class.isAssignableFrom(returnType)) {
                return "boolean";
            }
        }

        if (isMap(type)) { // Dictionary
            Type[] typeArguments = ((ParameterizedType) type).getActualTypeArguments();
            String keyType = javaToTSType(typeArguments[0], genericity, prefix, otherObjectsTypeD);
            String valueType = javaToTSType(typeArguments[1], genericity, prefix, otherObjectsTypeD);

            return "{\n  [key: " + keyType + "] :" + valueType + "\n}";
        }

        if (isCollection(type)) { // List / Set
            Type[] types = ((ParameterizedType) type).getActualTypeArguments();
            if (types.length == 1) {
                return javaToTSType(types[0], genericity, prefix, otherObjectsTypeD) + "[]";
            } else {
                for (Type t : types) {
                    String javaToTSType = javaToTSType(t, genericity, prefix, otherObjectsTypeD);
                    getLog().info("ArrayType:" + javaToTSType);
                }
                return "any[]";
            }
        }

        if (type instanceof Class && ((Class<?>) type).isEnum()) {
            Class<?> t = (Class<?>) type;
            String theEnum = "";
            Object[] enums = t.getEnumConstants();

            for (int i = 0; i < enums.length; i++) {
                theEnum += "'" + enums[i].toString() + "'";
                if (i < enums.length - 1) {
                    theEnum += " | ";
                }
            }
            return theEnum;
        }

        if (type instanceof Class) {
            String className = ((Class) type).getSimpleName();
            if (otherObjectsTypeD.containsKey(type)) {
                return prefix + className;
            } else if (isMergeable(type)) {
                return getTsInterfaceName((Class<? extends Mergeable>) type, genericity, prefix);
            } else {
                if (className != "void") {
                    String typeDef = "interface " + prefix + className + "{\n";
                    for (Field f : ((Class<?>) type).getDeclaredFields()) {
                        PropertyDescriptor propertyDescriptor;
                        try {
                            propertyDescriptor = new PropertyDescriptor(f.getName(), f.getDeclaringClass());
                        } catch (IntrospectionException e) {
                            continue;
                        }
                        typeDef += "  " + f.getName() + ": "
                            + javaToTSType(propertyDescriptor.getReadMethod().getGenericReturnType(), genericity, prefix, otherObjectsTypeD) + ";\n";
                    }
                    typeDef += "}\n";
                    otherObjectsTypeD.put(type, typeDef);
                    return prefix + className;
                }
                return className;
            }
        }
        if (type instanceof ParameterizedType) {
            ParameterizedType pType = (ParameterizedType) type;
            String typeName = pType.getRawType().getTypeName();
            return getTsInterfaceName(typeName, genericity, prefix);
        }
        return "undef";
    }

    private JSONExtendedSchema javaToJSType(Type type, boolean nullable) {
        switch (type.getTypeName()) {
            case "byte":
            case "short":
            case "int":
            case "long":
            case "java.lang.Byte":
            case "java.lang.Short":
            case "java.lang.Integer":
            case "java.lang.Long":
                return new JSONNumber(nullable); // JSONInteger is not handled.
            case "double":
            case "float":
            case "java.lang.Double":
            case "java.lang.Float":
            case "java.util.Date":
            case "java.util.Calendar":
                return new JSONNumber(nullable);
            case "char":
            case "java.lang.Character":
            case "java.lang.String":
                return new JSONString(nullable);
            case "java.lang.Boolean":
            case "boolean":
                return new JSONBoolean(nullable);
            default:
                break;
        }

        if (isMap(type)) { // Dictionary
            JSONObject jsonObject = new JSONObject(nullable);
            Type[] typeArguments = ((ParameterizedType) type).getActualTypeArguments();
            JSONSchema key = javaToJSType(typeArguments[0], false);
            if (!(key instanceof JSONString || key instanceof JSONNumber)) {
                getLog().warn(type + " Not of type string | number");
            }
            jsonObject.setAdditionalProperties(javaToJSType(typeArguments[1], false));

            return jsonObject;
        }

        if (isCollection(type)) { // List / Set
            JSONArray jsonArray = new JSONArray(nullable);
            for (Type t : ((ParameterizedType) type).getActualTypeArguments()) {
                jsonArray.setItems(javaToJSType(t, false));
            }
            return jsonArray;
        }

        if (type instanceof Class && ((Class<?>) type).isEnum()) {
            Class<?> t = (Class<?>) type;
            List<String> enums = new ArrayList<>();
            for (Object o : t.getEnumConstants()) {
                enums.add(o.toString());
            }
            JSONString jsonString = new JSONString(nullable);
            jsonString.setEnums(enums);
            return jsonString;
        }

        if (type instanceof Class) {
            if (otherObjectsSchemas.containsKey(type)) {
                return otherObjectsSchemas.get(type);
            } else if (isMergeable(type)) {
                return new JSONWRef(jsonFileName((Class<? extends Mergeable>) type), nullable);
            } else {
                JSONObject jsonObject = new JSONObject(nullable);
                otherObjectsSchemas.put(type, jsonObject);
                for (Field f : ((Class<?>) type).getDeclaredFields()) {
                    PropertyDescriptor propertyDescriptor;
                    try {
                        propertyDescriptor = new PropertyDescriptor(f.getName(), f.getDeclaringClass());
                    } catch (IntrospectionException e) {
                        continue;
                    }
                    jsonObject.setProperty(f.getName(),
                        javaToJSType(propertyDescriptor.getReadMethod().getGenericReturnType(), false));

                }

                return jsonObject;
            }
        }
        JSONUnknown jsonUnknown = new JSONUnknown();
        jsonUnknown.setDescription(type.getTypeName());
        return jsonUnknown;
    }

    private Map<String, ClassDoc> loadJavaDocFromJSON() {
        try {
            InputStream resourceAsStream = this.getClass().getClassLoader().getResourceAsStream("com/wegas/javadoc/javadoc.json");
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(resourceAsStream, new TypeReference<Map<String, ClassDoc>>() {
            });
        } catch (IOException ex) {
            return null;
        }
    }

    /**
     * Class which describe a method. To be serialised as JSON.
     */
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private class ScriptableMethod {

        private final Method m;

        private final String label;

        private final String returns;

        private final boolean nullable;

        private final List<Object> parameters;

        public ScriptableMethod(Method m) {
            this.m = m;
            Scriptable scriptable = m.getAnnotation(Scriptable.class);
            this.nullable = scriptable.nullable();

            if (Helper.isNullOrEmpty(scriptable.label())) {
                this.label = Helper.humanize(m.getName());
            } else {
                this.label = scriptable.label();
            }

            // determine return JS type
            if (scriptable.returnType().equals(Scriptable.ReturnType.AUTO)) {
                Class<?> returnType = wrap(m.getReturnType());
                if (Void.class.isAssignableFrom(returnType)) {
                    returns = "";
                } else if (Number.class.isAssignableFrom(returnType)) {
                    returns = "number";
                } else if (String.class.isAssignableFrom(returnType)) {
                    returns = "string";
                } else if (Boolean.class.isAssignableFrom(returnType)) {
                    returns = "boolean";
                } else {
                    returns = "undef";
                    // happens when returning abstract type (like VariableInstance)
                    getLog().warn("Unknown return type " + m);
                }
            } else {
                // VOID means setter
                returns = "";
            }

            // Process parameters
            parameters = Arrays.stream(m.getParameters()).map(p -> {
                Type type = p.getParameterizedType();

                if (type instanceof Class && ((Class) type).isAssignableFrom(Player.class)) {
                    JSONType prop = new JSONIdentifier();
                    prop.setConstant(new TextNode("self"));
                    prop.setView(new Hidden());
                    return prop;
                } else {
                    Class kl = m.getDeclaringClass();
                    Type reified = TypeResolver.reify(type, kl);
                    Param param = p.getAnnotation(Param.class);

                    JSONExtendedSchema prop = javaToJSType(reified, param != null && param.nullable());
                    if (param != null) {
                        prop.setRequired(!param.nullable());
                        injectView(prop, param.view(), null);
                        if (!Undefined.class.equals(param.proposal())) {
                            try {
                                prop.setValue(param.proposal().newInstance().getValue());
                            } catch (InstantiationException | IllegalAccessException ex) {
                                throw WegasErrorMessage.error("Param defautl value error");
                            }
                        }
                        return patchSchema(prop, param.schema());
                    }
                    return prop;
                }
            }).collect(Collectors.toList());
        }

        public List<Object> getParameters() {
            return parameters;
        }

        public String toString() {
            return m.getDeclaringClass().getSimpleName() + "#" + m.toString();
        }

        public String getLabel() {
            return label;
        }

        public String getReturns() {
            return returns;
        }

        public boolean isNullable() {
            return nullable;
        }
    }

    /**
     * JSONShemas for attributes and schemaMethods
     */
    private static class Config {

        private final JSONObject schema;

        private final Map<String, ScriptableMethod> methods;

        public Config() {
            this.schema = new JSONObject(false);
            this.methods = new HashMap<>();
        }

        public JSONObject getSchema() {
            return schema;
        }

        public Map<String, ScriptableMethod> getMethods() {
            return methods;
        }
    }

    /**
     * Main class. Run with dryrun profile: -Pdryrun
     *
     * @param args
     *
     * @throws MojoExecutionException
     */
    public static final void main(String... args) throws MojoExecutionException {
        SchemaGenerator wenerator = new SchemaGenerator(true, StringDescriptor.class);
        wenerator.execute();
    }
}
