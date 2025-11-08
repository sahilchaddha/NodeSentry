#!/usr/bin/env sh
INET=( $(ifconfig | awk '/inet /{print $2}') )
LOCAL_IP=($(ipconfig getifaddr en0))
LOCAL_HOSTNAME=$(hostname -s)
CLIENT_NAME="mac-client"
for i in "${!INET[@]}"; do
	echo "$i: ${INET[$i]}"
done
# Prepare mac_addresses JSON string from INET array
IP_JSON="{"
for i in "${!INET[@]}"; do
	IP_JSON+="\"$i\": \"${INET[$i]}\"," 
done
IP_JSON=${IP_JSON%,} # Remove trailing comma
IP_JSON+="}"
EXTERNAL_IP=$(curl -s http://checkip.dyndns.org | sed 's/[^0-9.]//g')
echo $EXTERNAL_IP
# Build the JSON payload using heredoc for proper formatting
JSON_PAYLOAD=$(cat <<EOF
{
	"name": "$CLIENT_NAME",
	"local_ip": "$LOCAL_IP",
	"external_ip": "$EXTERNAL_IP",
	"hostname": "$LOCAL_HOSTNAME.local",
	"custom_tags": {
		"location": "office"
	},
	"mac_addresses": $IP_JSON
}
EOF
)

curl -X POST http://localhost:3000/api/data \
	-H "Content-Type: application/json" \
	-H "X-API-Key: test-api-key-12345" \
	-d "$JSON_PAYLOAD"
