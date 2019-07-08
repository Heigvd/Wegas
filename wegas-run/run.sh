#!/bin/bash
BASEDIR=$(dirname $0)
DEPLOY=../wegas-app/target/Wegas
DEBUG=""
if [ "x$1" == "xdebug" ]
then
	DEBUG="-Xdebug -Xrunjdwp:transport=dt_socket,address=5005,server=y,suspend=n"
fi
if [ "x$1" == "xbuild" ]
then
    cd ..
	mvn clean install
else
    java $DEBUG -Dhazelcast.shutdownhook.enabled=true -jar $BASEDIR/payara-micro.jar --deploy $DEPLOY --domainconfig $BASEDIR/domain.xml --addlibs $BASEDIR/lib --systemproperties $BASEDIR/lib/classes/wegas-override.properties --autobindhttp --autobindssl
fi