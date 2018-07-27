/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.ProtectionLevel;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import javax.script.ScriptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class MergeHelper {

    private static final Logger logger = LoggerFactory.getLogger(MergeHelper.class);

    public interface MergeableVisitor {

        public void visit(Mergeable target, Mergeable reference, ProtectionLevel protectionLevel, int level, WegasFieldProperties field);
    }

    /**
     *
     *
     * @param target
     * @param reference
     * @param protectionLevel
     * @param forceRecursion  do not follow includeByDefault=false properted unless forceRecursion is true
     * @param visitor
     * @param level
     * @param f
     */
    public static void visitMergeable(Mergeable target, Mergeable reference,
            ProtectionLevel protectionLevel,
            Boolean forceRecursion, MergeableVisitor visitor, int level, WegasFieldProperties f) {

        if (target != null) {
            visitor.visit(target, reference, protectionLevel, level, f);

            WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(target.getClass());

            for (WegasFieldProperties field : entityIterator.getFields()) {
                try {
                    ProtectionLevel fieldProtectionLevel = field.getAnnotation().protectionLevel();
                    if (fieldProtectionLevel.equals(ProtectionLevel.CASCADED)) {
                        fieldProtectionLevel = protectionLevel;
                    }
                    if (field.getAnnotation().includeByDefault() || forceRecursion) {
                        Method readMethod = field.getPropertyDescriptor().getReadMethod();
                        switch (field.getType()) {
                            case CHILD:
                                Mergeable targetChild = (Mergeable) readMethod.invoke(target);
                                Mergeable referenceChild = null;

                                if (reference != null) {
                                    referenceChild = (Mergeable) readMethod.invoke(reference);
                                }

                                MergeHelper.visitMergeable(targetChild, referenceChild, fieldProtectionLevel, forceRecursion, visitor, level + 1, field);
                                break;
                            case CHILDREN:
                                Object children = readMethod.invoke(target);
                                Object referenceChildren = null;

                                if (reference != null) {
                                    referenceChildren = readMethod.invoke(reference);
                                }

                                if (children instanceof List) {
                                    List childrenList = (List) children;
                                    List refList = new ArrayList<>();
                                    if (referenceChildren instanceof List) {
                                        refList.addAll((List) referenceChildren);
                                    }

                                    if (!childrenList.isEmpty()) {
                                        for (int i = 0; i < childrenList.size(); i++) {
                                            Object get = childrenList.get(i);
                                            if (get instanceof Mergeable) {
                                                Mergeable refGet = null;

                                                // first try to fetch item with same refId
                                                for (Object other : refList) {
                                                    if (other instanceof Mergeable && ((Mergeable) other).getRefId().equals(((Mergeable) get).getRefId())) {
                                                        refGet = (Mergeable) other;
                                                        break;
                                                    }
                                                }
                                                if (refGet == null && get instanceof NamedEntity) {
                                                    // no reference with same refId, try to fetch by name
                                                    for (Object other : refList) {
                                                        if (other instanceof NamedEntity && ((NamedEntity) other).getName().equals(((NamedEntity) get).getName())) {
                                                            refGet = (Mergeable) other;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (refGet != null) {
                                                    // make sure to fetch refGet only once
                                                    refList.remove(refGet);
                                                }

                                                MergeHelper.visitMergeable((Mergeable) get, refGet, fieldProtectionLevel, forceRecursion, visitor, level + 1, field);
                                            } else {
                                                // children are not mergeable: skip all
                                                break;
                                            }
                                        }
                                    }
                                } else if (children instanceof Set) {
                                    Set childrenSet = (Set) children;
                                    Set refSet = new HashSet<>();
                                    if (referenceChildren instanceof Set) {
                                        refSet.addAll((Set) referenceChildren);
                                    }

                                    if (!childrenSet.isEmpty()) {
                                        for (Object get : childrenSet) {
                                            if (get instanceof Mergeable) {
                                                Mergeable refGet = null;

                                                // first try to fetch item with same refId
                                                for (Object other : refSet) {
                                                    if (other instanceof Mergeable && ((Mergeable) other).getRefId().equals(((Mergeable) get).getRefId())) {
                                                        refGet = (Mergeable) other;
                                                        break;
                                                    }
                                                }
                                                if (refGet == null && get instanceof NamedEntity) {
                                                    // no reference with same refId, try to fetch by name
                                                    for (Object other : refSet) {
                                                        if (other instanceof NamedEntity && ((NamedEntity) other).getName().equals(((NamedEntity) get).getName())) {
                                                            refGet = (Mergeable) other;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (refGet != null) {
                                                    // make sure to fetch refGet only once
                                                    refSet.remove(refGet);
                                                }

                                                MergeHelper.visitMergeable((Mergeable) get, refGet, fieldProtectionLevel, forceRecursion, visitor, level + 1, field);
                                            } else {
                                                // children are not mergeable: skip all
                                                break;
                                            }
                                        }
                                    }
                                } else if (children instanceof Map) {
                                    Map<Object, Object> childrenMap = (Map) children;
                                    Map<Object, Object> refMap = (Map) referenceChildren;

                                    for (Entry<Object, Object> entry : childrenMap.entrySet()) {
                                        Object child = entry.getValue();
                                        if (child instanceof Mergeable) {
                                            Mergeable ref = null;
                                            if (refMap != null) {
                                                ref = (Mergeable) refMap.get(entry.getKey());
                                            }
                                            MergeHelper.visitMergeable((Mergeable) child, ref, fieldProtectionLevel, forceRecursion, visitor, level + 1, field);
                                        } else {
                                            // children are not mergeable: skip all
                                            break;
                                        }
                                    }
                                }
                                break;
                            case PROPERTY:
                                Object targetProperty = readMethod.invoke(target);
                                Object referenceProperty = null;

                                if (reference != null) {
                                    referenceProperty = readMethod.invoke(reference);
                                }

                                break;
                        }
                    }
                } catch (Exception ex) {
                    logger.error(ex.toString());
                    throw new WegasErrorMessage("error", "Invocation Failure: should never appends: " + ex);
                }
            }
        }
    }

    private static class VisibilityResetter implements MergeableVisitor {

        private final Visibility visibility;

        public VisibilityResetter(Visibility visibility) {
            this.visibility = visibility;
        }

        @Override
        public void visit(Mergeable target, Mergeable reference, ProtectionLevel protectionLevel, int level, WegasFieldProperties field) {
            if (target instanceof ModelScoped) {
                ((ModelScoped) target).setVisibility(this.visibility);
            }
        }
    }

    /**
     * reset recursively target visibility to the given one.
     *
     * @param target
     * @param visibility
     */
    public static void resetVisibility(Mergeable target, Visibility visibility) {
        MergeHelper.visitMergeable(target, null, ProtectionLevel.PROTECTED, Boolean.TRUE, new VisibilityResetter(visibility), 0, null);
    }

    private static class RefidResetter implements MergeableVisitor {

        private final Boolean clear;

        private RefidResetter(Boolean clear) {
            this.clear = clear;
        }

        @Override
        public void visit(Mergeable target, Mergeable reference, ProtectionLevel protectionLevel, int level, WegasFieldProperties field) {

            if (target instanceof AbstractEntity) {
                AbstractEntity entity = (AbstractEntity) target;
                if (reference != null) {
                    entity.forceRefId(reference.getRefId());
                } else {
                    if (clear) {
                        entity.forceRefId(null);
                        entity.assertRefId();
                    }
                }
            }
        }
    }

    /**
     *
     * @param target
     * @param reference
     * @param clear     if true, clear resetId when there is no reference
     */
    public static void resetRefIds(AbstractEntity target, AbstractEntity reference, Boolean clear) {
        MergeHelper.visitMergeable(target, reference, ProtectionLevel.PROTECTED, Boolean.TRUE, new RefidResetter(clear), 0, null);
    }

    private static class LanguageUpgrader implements MergeableVisitor {

        private String oldCode;
        private String newCode;
        private I18nFacade i18nFacade;

        public LanguageUpgrader(String oldCode, String newCode, I18nFacade i18nFacade) {
            this.oldCode = oldCode;
            this.newCode = newCode;
            this.i18nFacade = i18nFacade;
        }

        @Override
        public void visit(Mergeable target, Mergeable reference, ProtectionLevel protectionLevel, int level, WegasFieldProperties field) {
            if (target instanceof TranslatableContent) {
                TranslatableContent tr = (TranslatableContent) target;
                Translation translation = tr.getTranslation(oldCode);
                if (translation != null) {
                    translation.setLang(newCode);
                }
            }

            if (target instanceof Script) {
                try {
                    Script script = (Script) target;
                    String newScript = i18nFacade.updateScriptRefName(script.getContent(), oldCode, newCode);
                    script.setContent(newScript);
                } catch (ScriptException ex) {
                    logger.error("SCRIPTERROR");
                }
            }
        }
    }

    /**
     * Update each occurence of the language code in the given gameModel.
     * each TranslatableContent property and each TranslatableContnent in any script will be updated.
     *
     * @param gameModel
     * @param oldCode
     * @param newCode
     * @param i18nFacade
     */
    public static void updateTranslationCode(GameModel gameModel, String oldCode, String newCode, I18nFacade i18nFacade) {
        MergeHelper.visitMergeable(gameModel, null, ProtectionLevel.PROTECTED, Boolean.TRUE, new LanguageUpgrader(oldCode, newCode, i18nFacade), 0, null);
    }

    /**
     * Copy translation from one set of mergeables to another one
     */
    private static class TranslationsImporter implements MergeableVisitor {

        private final String languageCode;
        private final I18nFacade i18nFacade;

        public TranslationsImporter(String languageCode, I18nFacade i18nFacade) {
            this.languageCode = languageCode;
            this.i18nFacade = i18nFacade;
        }

        @Override
        public void visit(Mergeable target, Mergeable reference, ProtectionLevel protectionLevel, int level, WegasFieldProperties field) {
            if (target instanceof TranslatableContent) {
                TranslatableContent trTarget = (TranslatableContent) target;

                if (trTarget.getTranslation(languageCode) != null) {
                    Visibility visibility = target.getInheritedVisibility();
                    if (!Helper.isProtected(protectionLevel, visibility)) {
                        // targret is not prodected, keep target translation
                        return;
                    }
                }

                if (reference instanceof TranslatableContent) {
                    TranslatableContent trRef = (TranslatableContent) reference;
                    Translation tr = trRef.getTranslation(languageCode);
                    if (tr != null) {
                        String translation = tr.getTranslation();
                        trTarget.updateTranslation(languageCode, translation);
                    } else {
                        logger.error("No {} Translation in Reference {}", languageCode, trRef);
                    }
                } else {
                    logger.error("No TranslationContent in Reference");
                }
            }

            if (target instanceof Script && reference instanceof Script) {
                i18nFacade.importTranslations((Script) target, (Script) reference, languageCode);
            }
        }
    }

    public static void importTranslations(Mergeable target, Mergeable source, String languageCode, I18nFacade i18nFacade) {
        MergeHelper.visitMergeable(target, source, ProtectionLevel.PROTECTED, Boolean.TRUE, new TranslationsImporter(languageCode, i18nFacade), 0, null);
    }

}
