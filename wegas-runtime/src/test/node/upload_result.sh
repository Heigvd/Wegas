#/bin/bash

FILES=$(find wegas-runtime/src/test/node/cypress/ -name "*.mp4" -or -name "*.png")
BIN_NAME=wegas_cypresstestresult_bin

OIFS=$IFS
IFS="
"

for fullPath in $FILES
do
    FILENAME=$(echo $fullPath | sed "s/^.*\///" | sed "s/^.*-- //" | sed "s/ /_/g")
    CLEAN_PATH=$(echo $fullPath | sed "s/ /\\ /g")
    echo curl --data-binary @${CLEAN_PATH} https://filebin.net/${BIN_NAME}/$FILENAME
    curl --data-binary @${CLEAN_PATH} https://filebin.net/${BIN_NAME}/$FILENAME
done

echo "Please visit https://filebin.net/${BIN_NAME}/"

IFS=$OIFS

