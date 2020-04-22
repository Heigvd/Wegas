package ch.albasim.wegas.annotations.processor;

import com.fasterxml.jackson.databind.ObjectMapper;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import java.beans.Introspector;
import java.io.IOException;
import java.io.Writer;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.PackageElement;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.tools.Diagnostic.Kind;
import javax.tools.FileObject;
import javax.tools.StandardLocation;

/**
 *
 * @author maxence
 */
/*@SupportedAnnotationTypes({
    "ch.albasim.wegas.annotations.WegasEntityProperty",
    "ch.albasim.wegas.annotations.WegasExtraProperty",
    "ch.albasim.wegas.annotations.Scriptable"
})*/
@SupportedSourceVersion(SourceVersion.RELEASE_11)
public class JavaDocExtractor extends AbstractProcessor {

    private Map<String, ClassDoc> data = new HashMap<>();

    @Override
    public Set<String> getSupportedAnnotationTypes() {
        Set<String> set = new HashSet<>();

        set.add(WegasEntityProperty.class.getName());
        set.add(WegasEntityProperty.class.getName());
        set.add(WegasEntityProperty.class.getName());
        
        return set;
    }

    private String getJavaDoc(Element element) {
        String docComment = processingEnv.getElementUtils().getDocComment(element);
        if (docComment != null) {
            return docComment.replaceAll("@author[^\n]*\n", "");
        } else {
            return null;
        }
    }

    private ClassDoc getClassDoc(Element element) {
        if (element instanceof TypeElement) {
            final TypeElement typeElement = (TypeElement) element;
            final PackageElement packageElement = (PackageElement) typeElement.getEnclosingElement();
            String packageName = packageElement.getQualifiedName().toString();
            String className = typeElement.getSimpleName().toString();

            String fullName = packageName + "." + className;

            if (!this.data.containsKey(fullName)) {
                String javadoc = this.getJavaDoc(element);

                ClassDoc classDoc = new ClassDoc();

                classDoc.setDoc(javadoc);
                classDoc.setPackageName(packageName);
                classDoc.setClassName(className);

                this.data.put(fullName, classDoc);
            }

            return this.data.get(fullName);

        } else if (element != null) {
            return getClassDoc(element.getEnclosingElement());
        } else {
            processingEnv.getMessager().printMessage(Kind.ERROR, "Error while extracting class javadoc");
            return null;
        }
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        /**
         * Process Fields
         */
        for (final Element element : roundEnv.getElementsAnnotatedWith(WegasEntityProperty.class)) {
            String javadoc = this.getJavaDoc(element);

            if (element instanceof TypeElement) {

            } else if (element instanceof VariableElement) {
                final VariableElement vElem = (VariableElement) element;

                ClassDoc classDoc = this.getClassDoc(element);

                String name = vElem.getSimpleName().toString();

                Map<String, String> fields = classDoc.getFields();
                if (fields.containsKey(name)) {
                    processingEnv.getMessager().printMessage(Kind.ERROR, "Duplicate field: " + classDoc.getFullName() + "::" + name);
                } else {
                    fields.put(name, javadoc);
                }
            }
        }

        /**
         * Fields: process WegasExtra
         */
        for (final Element element : roundEnv.getElementsAnnotatedWith(WegasExtraProperty.class)) {
            String javadoc = processingEnv.getElementUtils().getDocComment(element);
            if (element instanceof ExecutableElement) {
                final ExecutableElement eElem = (ExecutableElement) element;
                WegasExtraProperty extra = eElem.getAnnotation(WegasExtraProperty.class);

                ClassDoc classDoc = this.getClassDoc(element);

                String name;
                if (!extra.name().isEmpty()) {
                    name = extra.name();
                } else {
                    name = Introspector.decapitalize(eElem.getSimpleName().toString()
                            .replaceFirst("get", "").replaceFirst("is", ""));
                }

                Map<String, String> fields = classDoc.getFields();
                if (fields.containsKey(name)) {
                    processingEnv.getMessager().printMessage(Kind.ERROR, "Duplicate method: " + classDoc.getFullName() + "::" + name);
                } else {
                    fields.put(name, javadoc);
                }
            }
        }

        /**
         * Process Scriptable Methods
         */
        for (final Element element : roundEnv.getElementsAnnotatedWith(Scriptable.class)) {
            String javadoc = processingEnv.getElementUtils().getDocComment(element);
            if (element instanceof ExecutableElement) {
                final ExecutableElement eElem = (ExecutableElement) element;
                ClassDoc classDoc = this.getClassDoc(element);

                String name = eElem.getSimpleName().toString();

                Map<String, String> methods = classDoc.getMethods();
                if (methods.containsKey(name)) {
                    processingEnv.getMessager().printMessage(Kind.ERROR, "Duplicate method: " + classDoc.getFullName() + "::" + name);
                } else {
                    methods.put(name, javadoc);
                }
            }
        }

        if (roundEnv.processingOver()) {
            processingEnv.getMessager().printMessage(Kind.MANDATORY_WARNING, "WRITE IT");

            try {
                final FileObject fileObject = processingEnv.getFiler().createResource(StandardLocation.SOURCE_OUTPUT,
                        "com.wegas.javadoc", "javadoc.json");

                try (Writer writer = fileObject.openWriter()) {
                    ObjectMapper mapper = new ObjectMapper();
                    writer.append(mapper.writeValueAsString(this.data));
                }
            } catch (IOException ex) {
                processingEnv.getMessager().printMessage(Kind.ERROR, "Error while writing javadoc to JSON file");
            }
        }
        return true;
    }

}
