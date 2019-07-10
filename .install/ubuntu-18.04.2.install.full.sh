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

wget https://search.maven.org/remotecontent?filepath=fish/payara/distributions/payara/4.1.2.181/payara-4.1.2.181.zip -O payara.zip
unzip payara.zip
sudo rm -rf payara.zip

cp -r payara41/glassfish/domains/payaradomain/ payara41/glassfish/domains/wegasdomain/
cp .install/defaultfulldomain.xml payara41/glassfish/domains/wegasdomain/config/domain.xml

wget https://jdbc.postgresql.org/download/postgresql-9.4.1212.jar
mv postgresql-9.4.1212.jar payara41/glassfish/domains/wegasdomain/lib

cp .install/defaultwegas-override.properties payara41/glassfish/domains/wegasdomain/lib/classes/wegas-override.properties

sudo payara41/bin/asadmin start-domain wegasdomain

echo '#!/bin/sh' > run.sh
echo 'sudo payara41/bin/asadmin deploy --force wegas-app/target/Wegas.war' >> run.sh
sudo chmod 755 run.sh

echo "Don't forget to set up pusher credentials in payara41/glassfish/domains/wegasdomain/lib/classes/wegas-override.properties"
echo "To run the server simply type [./run.sh]"
echo "To dev client go to [wegas-app/src/main/webapp/2] and type [yarn start]"
