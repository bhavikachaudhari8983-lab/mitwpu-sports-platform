#!/bin/zsh
# Double-click this file in Finder to start the MIT-WPU Department of Sports platform and open it in your browser.
# Close this window (or press Ctrl+C) to stop the website.
cd "$(dirname "$0")"
PORT=3001
while lsof -ti :$PORT >/dev/null 2>&1; do PORT=$((PORT + 1)); done
URL="http://localhost:$PORT"

echo "Starting the MIT-WPU Department of Sports platform…"
[ -d node_modules ] || npm install
[ -f prisma/dev.db ] || npm run setup

# Open the browser once the site answers.
( for i in {1..90}; do curl -s -o /dev/null "$URL" && { open "$URL"; break; }; sleep 1; done ) &

echo "\nWebsite: $URL   (staff login: admin@mitwpu.example / Admin@12345)"
echo "Keep this window open. Close it to stop the website.\n"
NEXTAUTH_URL="$URL" npx next dev -p $PORT
