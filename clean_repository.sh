#!/bin/bash

BASE_M2=~/.m2/repository
SAVED_M2=$(mktemp -d /tmp/m2.repository.XXXXXX)
SETTINGS=$(mktemp /tmp/m2.settings.xml.XXXXXX)

# Download all dependencies to local m2 repository
mvn -Dmaven.repo.local=$BASE_M2 dependency:resolve 

# backup repository settings and move m2 repository to tmp directory
mv $BASE_M2/* $SAVED_M2

# remove "central" indication
find $SAVED_M2 -type f -name "maven-metadata-central.xml*" | sed "p;s/-central//"  | xargs -n2 mv

# custom settings
cat << END_TOKEN > ${SETTINGS}
<settings>
   <mirrors>
      <mirror>
         <id>mycentral</id>
         <name>My Central</name>
         <url>file:${SAVED_M2}</url>
         <mirrorOf>central</mirrorOf>
      </mirror>
   </mirrors>

   <profiles>
      <profile>
         <activation>
            <activeByDefault>true</activeByDefault>
         </activation>
         <repositories>
            <repository>
               <id>mycentral</id>
               <name>mycentra</name>
                  <url>file:${SAVED_M2}</url>
               <releases>
                  <enabled>true</enabled>
               </releases>
               <snapshots>
                  <enabled>true</enabled>
                  <updatePolicy>always</updatePolicy>
               </snapshots>
            </repository>
         </repositories>
      </profile>
   </profiles>
</settings>
END_TOKEN

# fetch deps again
mvn -s ${SETTINGS} -Dmaven.repo.local=$BASE_M2 dependency:resolve 

rm -R $SAVED_M2
rm $SETTINGS

