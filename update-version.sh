#!/bin/bash
VER='1.3.6'
sed -i 's/"version": ".*"/"version": "'$VER'"/' package.json
sed -i "s/\.version('.*')/\.version('$VER')/" cli/bin.ts
#git add package.json cli/bin.ts
#git commit -m "version ${VER}"
