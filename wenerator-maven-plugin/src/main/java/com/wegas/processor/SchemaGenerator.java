package com.wegas.processor;

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
import java.util.Optional;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.common.reflect.TypeToken;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.persistence.Mergeable;
import com.wegas.editor.Schema;
import com.wegas.editor.Schemas;
import com.wegas.editor.JSONSchema.JSONArray;
import com.wegas.editor.JSONSchema.JSONBoolean;
import com.wegas.editor.JSONSchema.JSONExtendedSchema;
import com.wegas.editor.JSONSchema.JSONNumber;
import com.wegas.editor.JSONSchema.JSONObject;
import com.wegas.editor.JSONSchema.JSONSchema;
import com.wegas.editor.JSONSchema.JSONString;
import com.wegas.editor.JSONSchema.JSONUnknown;
import com.wegas.editor.JSONSchema.JSONWRef;
import com.wegas.editor.View.CommonView;
import com.wegas.editor.View.View;

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

    public void processSchemaAnnotation(JSONObject o, Schema... schemas) {
        if (schemas != null) {
            for (Schema schema : schemas) {
                System.out.println("HERE YOU GO !!   " + (schema.property()));
                try {
                    JSONSchema val = schema.value().newInstance();
                    if (schema.merge()) {
                        val = merge(o.getProperties().get(schema.property()), val);
                    }
                    o.setProperty(schema.property(), val);
                    injectView(val, schema.view());
                } catch (InstantiationException | IllegalAccessException | IOException | IllegalArgumentException
                        | SecurityException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * inject View into Schema
     */
    private void injectView(JSONSchema schema, View view) {
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

    public JSONString getJSONClassName(Class<? extends Mergeable> klass) {
        JsonTypeName annotation = klass.getAnnotation(JsonTypeName.class);

        JSONString atClass = new JSONString();

        if (annotation != null) {
            atClass.setConstant(new TextNode(annotation.value()));
        } else {
            atClass.setConstant(new TextNode(klass.getSimpleName()));
        }

        return atClass;
    }

    public void execute() throws MojoExecutionException {
        if (outputDirectory.isFile()) {
            throw new MojoExecutionException(outputDirectory.getAbsolutePath() + " is not a directory");
        }
        getLog().info("Writing to " + outputDirectory.getAbsolutePath());
        outputDirectory.mkdirs();
        Set<Class<? extends Mergeable>> classes = new Reflections((Object[]) pkg).getSubTypesOf(Mergeable.class);

        classes.stream().map(c -> {
            try {
                return Optional.of(new WegasEntityFields(c));
            } catch (NoClassDefFoundError nf) {
                getLog().warn("Can't read " + c.getName() + " - No Class Def found for " + nf.getMessage());
                Optional<WegasEntityFields> empty = Optional.empty();
                return empty;
            }
        }).forEach(owEF -> {
            if (!owEF.isPresent()) {
                return;
            }
            final WegasEntityFields wEF = owEF.get();
            final JSONObject o = new JSONObject();
            // Fill Object
            o.setDescription(wEF.getTheClass().getName());

            o.setProperty("@class", getJSONClassName(wEF.getTheClass()));

            wEF.getFields().forEach(field -> {
                Type returnType = field.getPropertyDescriptor().getReadMethod().getGenericReturnType();
                Type reified = TypeResolver.reify(returnType, wEF.getTheClass());
                JSONSchema prop = javaToJSType(reified);
                injectView(prop, field.getAnnotation().view());
                o.setProperty(field.getPropertyDescriptor().getName(), prop);
            });

            Schemas schemas = wEF.getTheClass().getAnnotation(Schemas.class);
            if (schemas != null) {
                this.processSchemaAnnotation(o, schemas.value());
            }

            Schema schema = wEF.getTheClass().getAnnotation(Schema.class);
            if (schema != null) {
                this.processSchemaAnnotation(o, schema);
            }

            // Write
            File f = new File(outputDirectory, fileName(wEF.getTheClass()));
            try (FileWriter fw = new FileWriter(f)) {
                fw.write(mapper.writeValueAsString(o));
            } catch (IOException ex) {
                getLog().error("Failed to write " + f.getAbsolutePath(), ex);
            }
        });
    }

    public static <T> T merge(T sourceNode, T updateNode) throws JsonProcessingException, IOException {
        if (sourceNode == null) {
            return updateNode;
        }
        if (updateNode == null) {
            return sourceNode;
        }
        ObjectReader readerForUpdating = mapper.readerForUpdating(sourceNode);
        return readerForUpdating.readValue(mapper.writeValueAsString(updateNode));
    }

    private String fileName(Class<?> cls) {
        return cls.getName() + ".json";
    }

    private JSONSchema javaToJSType(Type type) {
        switch (type.getTypeName()) {
        case "int":
        case "long":
        case "java.lang.Long":
        case "java.lang.Integer":
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
                return new JSONWRef(fileName((Class<?>) type));
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

    private final Map<Type, JSONSchema> allObj = new HashMap<>();
}
