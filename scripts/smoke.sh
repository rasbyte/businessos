#!/usr/bin/env bash
# Starts the API and the web app, signs in as the developer and checks the signed-in pages.
# Needs Docker running and one free code request (the limit is one per minute).
set -u
cd "$(dirname "$0")/.."

PHONE=$(grep '^DEVELOPER_PHONE' .env | cut -d'"' -f2)
failures=0
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; failures=$((failures + 1)); }
expect() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected $3, got $2)"; fi; }
contains() { if grep -q "$3" "$2"; then pass "$1"; else fail "$1 (text not found: $3)"; fi; }
jget() {
  node -e "let s='';process.stdin.on('data',d=>{s+=d}).on('end',()=>{const v=JSON.parse(s);const r=process.argv[1].split('.').reduce((o,k)=>o==null?o:o[k],v);console.log(r??'')})" "$1"
}
stop_servers() {
  for port in 3000 3001; do
    pids=$(ss -ltnp 2>/dev/null | grep -E ":$port[^0-9]" | grep -o 'pid=[0-9]*' | cut -d= -f2)
    if [ -n "$pids" ]; then kill $pids; fi
  done
}
trap stop_servers EXIT

if ss -ltn 2>/dev/null | grep -qE ':(3000|3001)[^0-9]'; then
  echo "FAIL  port 3000 or 3001 is already in use"
  exit 1
fi

pnpm build > /tmp/smoke-build.log 2>&1 || { echo "FAIL  build"; tail -n 30 /tmp/smoke-build.log; exit 1; }
docker compose -f infra/docker-compose.yml exec -T redis sh -c "redis-cli --scan --pattern 'otp:*' | xargs -r redis-cli del" > /dev/null
(node apps/api/dist/main.js > /tmp/smoke-api.log 2>&1 &)
(pnpm --filter @businessos/web start > /tmp/smoke-web.log 2>&1 &)
sleep 7

API=localhost:3000/api
WEB=localhost:3001
JSON='content-type: application/json'
page() { curl -s -o "$2" -w "%{http_code}" -H "Cookie: bos_at=$ACCESS" "$WEB$1"; }

expect "signed out, /units redirects" "$(curl -s -o /dev/null -w '%{http_code}' "$WEB/units")" "307"
expect "request a sign-in code" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/request-code" -H "$JSON" -d "{\"phone\":\"$PHONE\"}")" "202"

CODE=$(grep -o "code is [0-9]*" /tmp/smoke-api.log | tail -n 1 | grep -o '[0-9]*')
login=$(curl -s -X POST "$API/auth/verify-code" -H "$JSON" -d "{\"phone\":\"$PHONE\",\"code\":\"$CODE\"}")
ACCESS=$(echo "$login" | jget accessToken)
if [ -z "$ACCESS" ]; then fail "sign in with the code"; exit 1; fi
pass "sign in with the code"
AUTH="authorization: Bearer $ACCESS"

ORG=$(curl -s "$API/auth/me" -H "$AUTH" | jget memberships.0.organization.id)
PROPERTY=$(curl -s "$API/orgs/$ORG/properties" -H "$AUTH" | jget 0.id)
if [ -z "$ORG" ] || [ -z "$PROPERTY" ]; then fail "organization and building found"; exit 1; fi
pass "organization and building found"

expect "/units page loads" "$(page /units /tmp/smoke-units.html)" "200"
contains "/units page shows the Bangla title" /tmp/smoke-units.html "ইউনিট"
expect "/units/new page loads" "$(page /units/new /tmp/smoke-new.html)" "200"

created=$(curl -s -X POST "$API/orgs/$ORG/units" -H "$AUTH" -H "$JSON" -d "{\"type\":\"SHOP\",\"propertyId\":\"$PROPERTY\",\"number\":\"Z-SMOKE\",\"shopCategory\":\"Smoke test\"}")
UNIT=$(echo "$created" | jget id)
if [ -n "$UNIT" ]; then pass "unit created through the API"; else fail "unit created through the API"; fi
expect "/units?filter=shops loads" "$(page '/units?filter=shops' /tmp/smoke-shops.html)" "200"
contains "the new unit is on the page" /tmp/smoke-shops.html "Z-SMOKE"

expect "the test unit is deleted" "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$API/orgs/$ORG/units/$UNIT" -H "$AUTH")" "204"
expect "sign out" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/logout" -H "$AUTH")" "204"

echo
if [ "$failures" -eq 0 ]; then echo "SMOKE PASSED"; else echo "SMOKE FAILED ($failures)"; exit 1; fi
