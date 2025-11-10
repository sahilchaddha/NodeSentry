#!/usr/bin/env sh
# Extract all inet addresses, filtering out localhost (127.0.0.1)
# Works on both macOS (ifconfig) and Linux/Debian (ip command)

# Check if 'ip' command is available (modern Linux)
if command -v ip >/dev/null 2>&1; then
  # Linux: use 'ip' command
  INET=( $(ip -4 addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1) )
elif command -v ifconfig >/dev/null 2>&1; then
  # macOS/BSD or older Linux: use 'ifconfig'
  INET=( $(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | sed 's/addr://g') )
else
  echo "Error: Neither 'ip' nor 'ifconfig' command found"
  exit 1
fi

LOCAL_HOSTNAME=$(hostname -s)
CLIENT_NAME="${CLIENT_NAME:-${2:-mac-client}}"
for i in "${!INET[@]}"; do
	echo "$i: ${INET[$i]}"
done
# Prepare local_ip JSON array from INET array
IP_JSON="["
for i in "${!INET[@]}"; do
	IP_JSON+="\"${INET[$i]}\","
done
IP_JSON=${IP_JSON%,} # Remove trailing comma
IP_JSON+="]"
EXTERNAL_IP=$(curl -s http://checkip.dyndns.org | sed 's/[^0-9.]//g')
echo $EXTERNAL_IP

# Get server URL from env, argument, or default
SERVER_URL="${SERVER_URL:-${1:-http://localhost:3000}}"

# Build the JSON payload using heredoc for proper formatting
JSON_PAYLOAD=$(cat <<EOF
{
  "name": "$CLIENT_NAME",
  "external_ip": "$EXTERNAL_IP",
  "hostname": "$LOCAL_HOSTNAME.local",
  "custom_tags": {
    "location": "office"
  },
  "local_ip": $IP_JSON
}
EOF
)
echo $SERVER_URL
curl -X POST "$SERVER_URL/api/data" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d "$JSON_PAYLOAD"

hz_mbp_js

# hz_mbp_og
# hz_rpi_wg3b
# hz_rpi_ha
# hz_gcp

# hz_nas_core
# hz_nas_secondary


# hz_pikvm
# hz_mbp_pof