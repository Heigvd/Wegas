package com.wegas.processor;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.beans.IntrospectionException;
import java.beans.PropertyDescriptor;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.common.reflect.TypeToken;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.annotations.Scriptable;
import com.wegas.core.persistence.annotations.WegasExtraProperty;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.editor.Schema;
import com.wegas.editor.Schemas;
import com.wegas.editor.JSONSchema.JSONArray;
import com.wegas.editor.JSONSchema.JSONBoolean;
import com.wegas.editor.JSONSchema.JSONExtendedSchema;
import com.wegas.editor.JSONSchema.JSONIdentifier;
import com.wegas.editor.JSONSchema.JSONNumber;
import com.wegas.editor.JSONSchema.JSONObject;
import com.wegas.editor.JSONSchema.JSONSchema;
import com.wegas.editor.JSONSchema.JSONString;
import com.wegas.editor.JSONSchema.JSONType;
import com.wegas.editor.JSONSchema.JSONUnknown;
import com.wegas.editor.JSONSchema.JSONWRef;
import com.wegas.editor.JSONSchema.UndefinedSchema;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.ValueGenerators.Undefined;
import com.wegas.editor.View.CommonView;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.View;
import com.wegas.editor.Visible;
import java.beans.Introspector;
import java.io.StringReader;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import javax.json.Json;
import javax.json.JsonMergePatch;
import javax.json.JsonValue;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;
import org.reflections.Reflections;

import net.jodah.typetools.TypeResolver;

@Mojo(name = "schema", defaultPhase = LifecyclePhase.PROCESS_CLASSES, requiresDependencyResolution = ResolutionScope.COMPILE)
public class SchemaGenerator extends AbstractMojo {

    private static final ObjectMapper mapper = JacksonMapperProvider.getMapper().enable(
            SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS,
            SerializationFeature.INDENT_OUTPUT
    );

    private final Class<? extends Mergeable>[] classFilter;

    /**
     * Generate files or not generate files
     */
    private boolean dryRun;
    /**
     * Location of the schemas.
     */
    @Parameter(defaultValue = "${project.build.directory}/generated/schema", property = "schema.output", required = true)
    private File outputDirectory;
    @Parameter(defaultValue = "${project.build.directory}/generated/typings", property = "schema.typings", required = true)
    private File outputTypings;

    @Parameter(property = "schema.pkg", required = true)
    private String[] pkg;
    private final Map<String, String> tsInterfaces;

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

        this.tsInterfaces = new HashMap<>();
    }

    public List<JsonMergePatch> processSchemaAnnotation(JSONObject o, Schema... schemas) {
        List<JsonMergePatch> patches = new ArrayList<>();

        if (schemas != null) {
            for (Schema schema : schemas) {
                System.out.println("Override Schema for  " + (schema.property()));
                try {
                    JSONSchema val = schema.value().newInstance();
                    injectView(val, schema.view());

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
                } catch (InstantiationException | IllegalAccessException | IllegalArgumentException | SecurityException
                        | IOException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
        }
        return patches;
    }

    private void injectErrords(JSONSchema schema, List<Errored> erroreds) {
        if (erroreds != null) {
            if (schema instanceof JSONExtendedSchema) {
                for (Errored e : erroreds) {
                    ((JSONExtendedSchema) schema).addErrored(e);
                }
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
    private void injectView(JSONSchema schema, View view) {
        if (view != null) {
            if (schema instanceof JSONExtendedSchema) {
                try {
                    CommonView v = view.value().newInstance();

                    if (!view.label().isEmpty()) {
                        v.setLabel(view.label());
                    }
                    v.setBorderTop(view.borderTop()).setDescription(view.description()).setLayout(view.layout());
                    ((JSONExtendedSchema) schema).setFeatureLevel(view.featureLevel());
                    ((JSONExtendedSchema) schema).setView(v);
                    v.setIndex(view.index()); // TO REMOVE
                    ((JSONExtendedSchema) schema).setIndex(view.index());
                } catch (InstantiationException | IllegalAccessException e) {
                    e.printStackTrace();
                    throw WegasErrorMessage.error("Fails to inject " + view);
                }
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

    private String getTsInterfaceName(String className, Map<String, String> genericity) {
        try {
            Class<?> forName = Class.forName(className);
            if (Mergeable.class.isAssignableFrom(forName)) {
                return getTsInterfaceName((Class<? extends Mergeable>) forName, genericity);
            }
        } catch (ClassNotFoundException ex) {
        }
        throw WegasErrorMessage.error(className + " not found");
    }

    private String getTsInterfaceName(Class<? extends Mergeable> klass, Map<String, String> genericity) {
        String tsName = "I" + Mergeable.getJSONClassName(klass);
        if (genericity != null) {
            if (genericity.containsKey(tsName)) {
                return genericity.get(tsName);
            }
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

    private void generateTsInterface(WegasEntityFields wEF, Map<Method, WegasExtraProperty> extraProperties) {
        Class<? extends Mergeable> c = wEF.getTheClass();

        boolean isAbstract = Modifier.isAbstract(c.getModifiers());

        StringBuilder sb = new StringBuilder();
        sb.append("interface ").append(getTsInterfaceName(c, null));
        // classname to paramter type map (eg. VariableInstance -> T)
        Map<String, String> genericity = new HashMap<>();
        List<String> genericityOrder = new ArrayList<>();

        if (c.getTypeParameters() != null) {
            for (Type t : c.getTypeParameters()) {
                String typeName = t.getTypeName();
                Type reified = TypeResolver.reify(t, c);
                String tsType = javaToTSType(reified, null);
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
                if (!isAbstract) {
                    sb.append("WithoutAtClass<");
                }
                sb.append(getTsInterfaceName((Class<? extends Mergeable>) c.getSuperclass(), null));

                Type[] gTypes = c.getSuperclass().getTypeParameters();
                if (gTypes != null && gTypes.length > 0) {
                    sb.append("<");
                    Arrays.stream(gTypes).forEach(t -> {
                        sb.append(javaToTSType(TypeResolver.reify(t, c), genericity)).append(",");
                    });
                    sb.deleteCharAt(sb.length() - 1);
                    sb.append(">");
                }

                if (!isAbstract) {
                    sb.append(">");
                }
            } else {
                sb.append(" extends IMergeable");
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

        if (!isAbstract) {
            // @class hack: constant value for concrete classes
            properties.put("@class", "  readonly '@class': '" + Mergeable.getJSONClassName(c) + "';\n");
        }

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
            System.out.println(c.getSimpleName() + ":");
            System.out.println(sb);
        } else {
            String iName = getTsInterfaceName(c, null);
            tsInterfaces.put(iName, "/*\n * " + iName + "\n */\n" + sb + "\n");
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
        String tsType = javaToTSType(reified, genericity);
        if (genericity.containsKey(tsType)) {
            tsType = genericity.get(tsType);
        }

        String property = "  ";
        if (deprecated) {
            property += "/* @deprecated */\n  ";
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

    /**
     * Go through super method implementation to fetch a spectific annotation
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
            } catch (NoSuchMethodException | SecurityException ex) {
                // silent catch
            }

            queue.addAll(Arrays.asList(klass.getInterfaces()));

            if (klass.getSuperclass() != null) {
                queue.addLast(klass.getSuperclass());
            }

        }

        return null;
    }

    /**
     *
     */
    private void writeTsInterfacesToFile() {

        StringBuilder sb = new StringBuilder();

        sb.append("/**\n" + " * Remove specified keys.\n" + " */\n" + "type WithoutAtClass<Type> = Pick<\n"
                + "    Type,\n" + "    Exclude<keyof Type, '@class'>\n" + ">;");
        sb.append("/*\n")
                .append(" * IMergeable\n")
                .append(" */\n")
                .append("interface IMergeable {\n")
                .append("  readonly \"@class\": string;\n")
                .append("  refId?: string;\n")
                .append("  readonly parentType?: string;\n")
                .append("  readonly parentId?: number;\n")
                .append("}\n");

        tsInterfaces.keySet().stream().sorted().map(tsInterfaces::get).forEach(sb::append);

        this.otherObjectsTypeD.forEach((klass, typeDef) -> {
            sb.append("/*\n * ").append(((Class) klass).getSimpleName()).append("\n */\n");
            sb.append(typeDef).append("\n");
        });

        File f = new File(outputTypings, "WegasEntities.d.ts");

        try (FileWriter fw = new FileWriter(f)) {
            fw.write(sb.toString());
        } catch (IOException ex) {
            getLog().error("Failed to write " + f.getAbsolutePath(), ex);
        }
    }

    @Override
    public void execute() throws MojoExecutionException {
        Set<Class<? extends Mergeable>> classes;

        if (!dryRun) {
            pkg = new String[]{"com.wegas"};
            classes = new Reflections((Object[]) pkg).getSubTypesOf(Mergeable.class);

            if (outputDirectory.isFile()) {
                throw new MojoExecutionException(outputDirectory.getAbsolutePath() + " is not a directory");
            }
            if (outputTypings.isFile()) {
                throw new MojoExecutionException(outputTypings.getAbsolutePath() + " is not a directory");
            }
            getLog().info("Writing to " + outputDirectory.getAbsolutePath());
            outputDirectory.mkdirs();
            outputTypings.mkdirs();
        } else {
            getLog().info("DryRun: do not generate any files");
            classes = new HashSet<>(Arrays.asList(this.classFilter));
        }

        getLog().info("Mergeable Subtypes: " + classes.size());

        /*
         * Hold a reference to generated file names
         */
        Map<String, String> jsonBuiltFileNames = new HashMap<>();

        classes.stream()
                // ignore classes the client dont need
                .filter(c -> !c.isAnonymousClass()).forEach(c -> {
            try {
                WegasEntityFields wEF = new WegasEntityFields(c);

                final Config config = new Config();
                Map<String, ScriptableMethod> methods = config.getMethods();

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
                }

                /*
                 * Process all public methods (including inherited ones)
                 */
                // abstract classes too ? restrict ton concretes ??
                methods.putAll(Arrays.stream(c.getMethods())
                        // brige: methods duplicated when return type is overloaded (see
                        // PrimitiveDesc.getValue)
                        .filter(m -> m.isAnnotationPresent(Scriptable.class) && !m.isBridge())
                        .collect(Collectors.toMap((Method m) -> m.getName(), ScriptableMethod::new)));

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
                                        field.getAnnotation().protectionLevel()
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
                                ModelScoped.ProtectionLevel.CASCADED
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
                    String fileName = jsonFileName(c);

                    if (jsonBuiltFileNames.containsKey(fileName)) {
                        // At that point seems we have duplicate "@class"
                        getLog().error("Duplicate file name " + fileName + "classes "
                                + jsonBuiltFileNames.get(fileName) + " <> " + c.getName());
                        return;
                    }
                    jsonBuiltFileNames.put(fileName, wEF.getTheClass().getName());

                    if (!dryRun) {
                        File f = new File(outputDirectory, fileName);
                        try (FileWriter fw = new FileWriter(f)) {
                            fw.write(configToString(config, patches));
                        } catch (IOException ex) {
                            getLog().error("Failed to write " + f.getAbsolutePath(), ex);
                        }
                    } else {
                        System.out.println(fileName);
                        System.out.println(configToString(config, patches));
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
            writeTsInterfacesToFile();
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
            Class<? extends ValueGenerators.ValueGenerator> proposal,
            ModelScoped.ProtectionLevel protectionLevel) {

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

        if (!optional) {
            if (prop instanceof JSONExtendedSchema) {
                ((JSONExtendedSchema) prop).setRequired(true);
            }
        }

        injectView(prop, view);
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

    private String javaToTSType(Type type, Map<String, String> genericity) {
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

        TypeToken<Collection<?>> collection = new TypeToken<Collection<?>>() {
        };
        TypeToken<Map<?, ?>> mapType = new TypeToken<Map<?, ?>>() {
        };
        if (mapType.isSupertypeOf(type)) { // Dictionary
            Type[] typeArguments = ((ParameterizedType) type).getActualTypeArguments();
            String keyType = javaToTSType(typeArguments[0], genericity);
            String valueType = javaToTSType(typeArguments[1], genericity);

            return "{\n  [key: " + keyType + "] :" + valueType + "\n}";
        }

        if (collection.isSupertypeOf(type)) { // List / Set
            Type[] types = ((ParameterizedType) type).getActualTypeArguments();
            if (types.length == 1) {
                return javaToTSType(types[0], genericity) + "[]";
            } else {
                for (Type t : types) {
                    String javaToTSType = javaToTSType(t, genericity);
                    System.out.println("ArrayType:" + javaToTSType);
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
            if (otherObjectsTypeD.containsKey(type)) {
                return ((Class) type).getSimpleName();
            } else if (new TypeToken<Mergeable>() {
            }.isSupertypeOf(type)) {
                return getTsInterfaceName((Class<? extends Mergeable>) type, genericity);
            } else {
                String typeDef = "interface " + ((Class) type).getSimpleName() + "{\n";
                for (Field f : ((Class<?>) type).getDeclaredFields()) {
                    PropertyDescriptor propertyDescriptor;
                    try {
                        propertyDescriptor = new PropertyDescriptor(f.getName(), f.getDeclaringClass());
                    } catch (IntrospectionException e) {
                        continue;
                    }
                    typeDef += "  " + f.getName() + ": "
                            + javaToTSType(propertyDescriptor.getReadMethod().getGenericReturnType(), genericity) + ";\n";
                }
                typeDef += "}\n";
                otherObjectsTypeD.put(type, typeDef);

                return ((Class) type).getSimpleName();
            }
        }
        if (type instanceof ParameterizedType) {
            ParameterizedType pType = (ParameterizedType) type;
            String typeName = pType.getRawType().getTypeName();
            return getTsInterfaceName(typeName, genericity);
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
        TypeToken<Collection<?>> collection = new TypeToken<Collection<?>>() {
        };
        TypeToken<Map<?, ?>> mapType = new TypeToken<Map<?, ?>>() {
        };
        if (mapType.isSupertypeOf(type)) { // Dictionary
            JSONObject jsonObject = new JSONObject(nullable);
            Type[] typeArguments = ((ParameterizedType) type).getActualTypeArguments();
            JSONSchema key = javaToJSType(typeArguments[0], false);
            if (!(key instanceof JSONString || key instanceof JSONNumber)) {
                getLog().warn(type + " Not of type string | number");
            }
            jsonObject.setAdditionalProperties(javaToJSType(typeArguments[1], false));

            return jsonObject;
        }

        if (collection.isSupertypeOf(type)) { // List / Set
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
            } else if (new TypeToken<Mergeable>() {
            }.isSupertypeOf(type)) {
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

    private final Map<Type, String> otherObjectsTypeD = new HashMap<>();

    private final Map<Type, JSONExtendedSchema> otherObjectsSchemas = new HashMap<>();

    /**
     * Class which describe a method. To be serialised as JSON.
     */
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private class ScriptableMethod {

        private final Method m;

        private final String label;

        private final String returns;

        private final List<JSONSchema> parameters;

        public ScriptableMethod(Method m) {
            this.m = m;
            Scriptable scriptable = m.getAnnotation(Scriptable.class);

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
                    getLog().error("Unknow return type " + m, null);
                    // TODO: throw error
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
                    boolean nullable = false;
                    JSONExtendedSchema prop = javaToJSType(reified, param != null && param.nullable());
                    if (param != null) {
                        injectView(prop, param.view());
                        if (!Undefined.class.equals(param.proposal())) {
                            try {
                                prop.setValue(param.proposal().newInstance().getValue());
                            } catch (InstantiationException | IllegalAccessException ex) {
                                throw WegasErrorMessage.error("Param defautl value error");
                            }
                        }
                    }
                    return prop;
                }
            }).collect(Collectors.toList());
        }

        public List<JSONSchema> getParameters() {
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
    }

    /**
     * JSONShemas for attributes and methods
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
     * Main class.
     * Run with dryrun profile: -Pdryrun
     *
     * @param args
     *
     * @throws MojoExecutionException
     */
    public static final void main(String... args) throws MojoExecutionException {
        SchemaGenerator wenerator = new SchemaGenerator(true, ListDescriptor.class);
        wenerator.execute();
    }
}
