#!/bin/bash
# Compila el motor Java (engine/ + web-src/) a JavaScript con TeaVM -> docs/js/engine.js
# Requisitos: JDK 17+, Maven (la primera vez descarga TeaVM). Uso: tools/build_web.sh
set -eo pipefail
cd "$(dirname "$0")/.."
TV=${TEAVM_DIR:-/tmp/teavm}
if [ ! -d "$TV/libs" ]; then
  mkdir -p "$TV"
  cat > "$TV/pom.xml" <<'XML'
<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion>
<groupId>x</groupId><artifactId>tv</artifactId><version>1</version>
<dependencies>
 <dependency><groupId>org.teavm</groupId><artifactId>teavm-cli</artifactId><version>0.11.0</version></dependency>
 <dependency><groupId>org.teavm</groupId><artifactId>teavm-jso</artifactId><version>0.11.0</version></dependency>
 <dependency><groupId>org.teavm</groupId><artifactId>teavm-jso-apis</artifactId><version>0.11.0</version></dependency>
</dependencies></project>
XML
  (cd "$TV" && mvn -q -B dependency:copy-dependencies -DoutputDirectory=libs)
fi
OUT=$(mktemp -d)
mkdir -p "$OUT/classes" "$OUT/js"
javac --release 8 -nowarn -encoding UTF-8 -cp "$TV/libs/*" -d "$OUT/classes" $(ls engine/*.java | grep -v -e SpriteExtractor -e AnilImporter) web-src/pokefuego/web/*.java
java -cp "$TV/libs/*" org.teavm.cli.TeaVMRunner -d "$OUT/js" -t js -p "$OUT/classes" -O 2 pokefuego.web.Main
mkdir -p docs/js && cp "$OUT/js/classes.js" docs/js/engine.js
echo "OK -> docs/js/engine.js ($(du -h docs/js/engine.js | cut -f1))"
