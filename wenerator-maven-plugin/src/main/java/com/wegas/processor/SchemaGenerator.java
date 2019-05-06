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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.TextNode;
import com.github.fge.jsonpatch.JsonPatchException;
import com.github.fge.jsonpatch.mergepatch.JsonMergePatch;
import com.google.common.reflect.TypeToken;
import com.wegas.core.Helper;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.annotations.Scriptable;
import com.wegas.core.persistence.game.Player;
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
import com.wegas.editor.View.CommonView;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.View;
import com.wegas.editor.Visible;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.stream.Collectors;

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

    private static final ObjectMapper mapper = (new ObjectMapper()).enable(SerializationFeature.INDENT_OUTPUT);
    /**
     * Location of the classes.
     */
    @Parameter(defaultValue = "${project.build.directory}/generated-schema", property = "schema.outputDirectory", required = true)
    private File outputDirectory;

    @Parameter(property = "schema.pkg", required = true)
    private String[] pkg;

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
                        patches.add(mapper.readValue(mapper.writeValueAsString(newConfig), JsonMergePatch.class));
                    } else {
                        o.setProperty(schema.property(), val);
                    }
                } catch (InstantiationException | IllegalAccessException | IllegalArgumentException
                        | SecurityException | IOException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
        }
        return patches;
    }

    private void injectErrords(JSONSchema schema, List<Errored> erroreds) {
        if (schema instanceof JSONExtendedSchema) {
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
    private void injectView(JSONSchema schema, View view) {
        if (view != null) {
            if (schema instanceof JSONExtendedSchema) {
                try {
                    CommonView v = view.value().newInstance();
                    v.setLabel(view.label()).setBorderTop(view.borderTop()).setDescription(view.description())
                            .setLayout(view.layout());
                    ((JSONExtendedSchema) schema).setView(v);
                    ((JSONExtendedSchema) schema).setIndex(view.index());
                } catch (InstantiationException | IllegalAccessException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
        }
    }

    public JSONString getJSONClassName(Class<? extends Mergeable> klass) {
        JSONString atClass = new JSONString();
        atClass.setConstant(new TextNode(Mergeable.getJSONClassName(klass)));
        atClass.setView(new Hidden());
        return atClass;
    }

    public void execute() throws MojoExecutionException {
        if (outputDirectory.isFile()) {
            throw new MojoExecutionException(outputDirectory.getAbsolutePath() + " is not a directory");
        }
        getLog().info("Writing to " + outputDirectory.getAbsolutePath());
        outputDirectory.mkdirs();

        Set<Class<? extends Mergeable>> classes = new Reflections((Object[]) pkg).getSubTypesOf(Mergeable.class);

        /*
         * Hold a reference to generated file names
         */
        Map<String, String> builtFileNames = new HashMap<>();
        classes.stream().filter(c
                // ignore classes the client dont need
                -> !Modifier.isAbstract(c.getModifiers())
                && !c.isAnonymousClass())
                .forEach(c -> {
                    try {
                        WegasEntityFields wEF = new WegasEntityFields(c);

                        final Config config = new Config();
                        JSONObject jsonSchema = config.getSchema();
                        Map<String, ScriptableMethod> methods = config.getMethods();

                        /*
                         * Process all public methods (including inherited ones)
                         */
                        methods.putAll(Arrays.stream(c.getMethods())
                                // brige: methods duplicated when return type is overloaded (see PrimitiveDesc.getValue)
                                .filter(m -> m.isAnnotationPresent(Scriptable.class) && !m.isBridge())
                                .collect(Collectors.toMap(
                                        (Method m) -> m.getName(),
                                        ScriptableMethod::new
                                )));

                        // Fill Schema
                        jsonSchema.setDescription(c.getName());
                        jsonSchema.setProperty("@class", getJSONClassName(c));

                        wEF.getFields().forEach(field -> {
                            Type returnType = field.getPropertyDescriptor().getReadMethod().getGenericReturnType();
                            Type reified = TypeResolver.reify(returnType, c);
                            JSONSchema prop = javaToJSType(reified);
                            injectView(prop, field.getAnnotation().view());
                            injectErrords(prop, field.getErroreds());
                            injectVisible(prop, field.getField().getAnnotation(Visible.class));
                            jsonSchema.setProperty(field.getPropertyDescriptor().getName(), prop);
                        });

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
                        String fileName = fileName(c);

                        if (builtFileNames.containsKey(fileName)) {
                            // At that point seems we have duplicate "@class"
                            getLog().error("Duplicate file name " + fileName + "classes " + builtFileNames.get(fileName) + " <> "
                                    + c.getName());
                            return;
                        }
                        builtFileNames.put(fileName, wEF.getTheClass().getName());
                        File f = new File(outputDirectory, fileName);
                        try (FileWriter fw = new FileWriter(f)) {
                            fw.write(configToString(config, patches));
                        } catch (IOException ex) {
                            getLog().error("Failed to write " + f.getAbsolutePath(), ex);
                        }
                    } catch (NoClassDefFoundError nf) {
                        getLog().warn("Can't read " + c.getName() + " - No Class Def found for " + nf.getMessage());
                    }
                });
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
            JsonNode jsonNode = mapper.valueToTree(config);
            for (JsonMergePatch patch : patches) {
                jsonNode = patch.apply(jsonNode);
            }
            return mapper.writeValueAsString(jsonNode);
        } catch (JsonPatchException | JsonProcessingException ex) {
            getLog().error("Failed to generate JSON", ex);
            return "ERROR, SHOULD CRASH";
        }
    }

    private String fileName(Class<? extends Mergeable> cls) {
        return Mergeable.getJSONClassName(cls) + ".json";
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

    private JSONExtendedSchema javaToJSType(Type type) {
        switch (type.getTypeName()) {
            case "byte":
            case "short":
            case "int":
            case "long":
            case "java.lang.Byte":
            case "java.lang.Short":
            case "java.lang.Integer":
            case "java.lang.Long":
                return new JSONNumber(); // JSONInteger is not handled.
            case "double":
            case "float":
            case "java.lang.Double":
            case "java.lang.Float":
            case "java.util.Date":
            case "java.util.Calendar":
                return new JSONNumber();
            case "char":
            case "java.lang.Character":
            case "java.lang.String":
                return new JSONString();
            case "java.lang.Boolean":
            case "boolean":
                return new JSONBoolean();
            default:
                break;
        }
        TypeToken<Collection<?>> collection = new TypeToken<Collection<?>>() {
        };
        TypeToken<Map<?, ?>> mapType = new TypeToken<Map<?, ?>>() {
        };
        if (mapType.isSupertypeOf(type)) { // Dictionary
            JSONObject jsonObject = new JSONObject();
            Type[] typeArguments = ((ParameterizedType) type).getActualTypeArguments();
            JSONSchema key = javaToJSType(typeArguments[0]);
            if (!(key instanceof JSONString || key instanceof JSONNumber)) {
                getLog().warn(type + " Not of type string | number");
            }
            jsonObject.setAdditionalProperties(javaToJSType(typeArguments[1]));

            return jsonObject;
        }

        if (collection.isSupertypeOf(type)) { // List / Set
            JSONArray jsonArray = new JSONArray();
            for (Type t : ((ParameterizedType) type).getActualTypeArguments()) {
                jsonArray.setItems(javaToJSType(t));
            }
            return jsonArray;
        }

        if (type instanceof Class && ((Class<?>) type).isEnum()) {
            Class<?> t = (Class<?>) type;
            List<JsonNode> enums = new ArrayList<>();
            for (Object o : t.getEnumConstants()) {
                enums.add(new TextNode(o.toString()));
            }
            JSONString jsonString = new JSONString();
            jsonString.setEnums(enums);
            return jsonString;
        }

        if (type instanceof Class) {
            if (allObj.containsKey(type)) {
                return allObj.get(type);
            } else if (new TypeToken<Mergeable>() {
            }.isSupertypeOf(type)) {
                return new JSONWRef(fileName((Class<? extends Mergeable>) type));
            } else {
                JSONObject jsonObject = new JSONObject();
                allObj.put(type, jsonObject);
                for (Field f : ((Class<?>) type).getDeclaredFields()) {
                    PropertyDescriptor propertyDescriptor;
                    try {
                        propertyDescriptor = new PropertyDescriptor(f.getName(), f.getDeclaringClass());
                    } catch (IntrospectionException e) {
                        continue;
                    }
                    jsonObject.setProperty(f.getName(),
                            javaToJSType(propertyDescriptor.getReadMethod().getGenericReturnType()));

                }

                return jsonObject;
            }
        }
        JSONUnknown jsonUnknown = new JSONUnknown();
        jsonUnknown.setDescription(type.getTypeName());
        return jsonUnknown;
    }

    private final Map<Type, JSONExtendedSchema> allObj = new HashMap<>();

    /**
     * Class which describe a method.
     * To be serialised as JSON.
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
                    //TODO: throw error
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
                    JSONExtendedSchema prop = javaToJSType(reified);
                    Param param = p.getAnnotation(Param.class);
                    if (param != null) {
                        injectView(prop, param.view());
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
            this.schema = new JSONObject();
            this.methods = new HashMap<>();
        }

        public JSONObject getSchema() {
            return schema;
        }

        public Map<String, ScriptableMethod> getMethods() {
            return methods;
        }
    }
}
