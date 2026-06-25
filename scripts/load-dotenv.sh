# Load /app/.env into the shell without overriding variables already set by
# Kubernetes (ConfigMap / Secret env). Use for 1Password-synced dotenv mounts.
load_dotenv() {
	[ -f /app/.env ] || return 0
	while IFS= read -r line || [ -n "$line" ]; do
		case "$line" in
		'' | \#*) continue ;;
		*=*) ;;
		*) continue ;;
		esac
		key="${line%%=*}"
		val="${line#*=}"
		# shellcheck disable=SC2163
		eval 'if [ -z "${'"$key"'+x}" ]; then export '"$key"'="$val"; fi'
	done < /app/.env
}
