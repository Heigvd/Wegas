#!/bin/sh

sudo apt-get -y install git openjdk-8-jdk postgresql postgresql-contrib maven nodejs npm docker.io

if [ -d ../.git ]; then
echo "skipping cloning";
cd ..;
pwd;
else
echo "cloning Wegas...";
git clone git@github.com:Heigvd/Wegas.git Wegas;
cd Wegas;
fi;

git submodule init
git config submodule.wegas-app/src/main/webapp/wegas-private.url git@github.com:Heigvd/WegasPrivate.git
git submodule update

sudo update-alternatives --config java

echo "CREATE USER \"user\" WITH PASSWORD '1234' SUPERUSER;
CREATE DATABASE "wegas_dev";
CREATE DATABASE "wegas_test";
\q" | sudo -u postgres psql

sudo npm install yarn -g

sudo docker pull mongo
sudo docker run -p 27017:27017 --name wegasmongo -d mongo
sudo docker start wegasmongo

mvn clean install

mkdir -p .run/lib/classes
cd .run
wget https://search.maven.org/remotecontent?filepath=fish/payara/extras/payara-micro/4.1.2.181/payara-micro-4.1.2.181.jar -O payara-micro.jar

cp ../.install/defaultmicrodomain.xml domain.xml
cp ../.install/defaultwegas-override.properties lib/classes/wegas-override.properties

cd lib
wget https://jdbc.postgresql.org/download/postgresql-9.4.1212.jar
cd ..

cd ..
echo '#!/bin/sh' > run.sh
echo 'java -Dhazelcast.shutdownhook.enabled=true -jar .run/payara-micro.jar --deploy wegas-app/target/Wegas.war --domainconfig .run/domain.xml --addlibs .run/lib --systemproperties .run/lib/classes/wegas-override.properties --autobindhttp --autobindssl ' >> run.sh
sudo chmod 755 run.sh

echo "Don't forget to set up pusher credentials in .run/lib/classes/wegas-override.properties"
echo "To run the server simply type [./run.sh]"
echo "To dev client go to [wegas-app/src/main/webapp/2] and type [yarn start]"
