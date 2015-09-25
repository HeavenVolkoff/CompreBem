@ECHO OFF

ECHO Automated Batch File to Browserify and Uglify the Background.js file

CALL browserify background.js -o ..\background.js

CALL uglifyjs ../background.js -c -m -o ../background.min.js --source-map ..\background.min.js.map

pause