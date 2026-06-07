#!/usr/bin/env bash
set -uo pipefail

# Chain two ACT policies with lazy-loaded hot-swap.
#
#   grab-all  (policy #1, loaded + active at startup)
#        --[ press 's' ]-->  clean0 (policy #2, loaded into VRAM on first swap)
#
# Only policy #1 is loaded up front and starts executing immediately. Pressing
# 's' loads clean0 into VRAM on the FIRST press (one-time model-load cost) and
# switches to it; both stay resident afterwards, so any later swap is an instant
# server-side pointer change. The robot client keeps the arms connected the whole
# time — no disconnect, no position reset.
#
# Controls (while the client is running and focused):
#   s        cycle to the next policy (lazy-loads it the first time)
#   1 / 2    jump directly to grab-all / clean0
#
# Usage:
#   ./chain.sh                 # start server (if needed) + client; policy #1 warm
#   POLICY_A=... POLICY_B=...  ./chain.sh    # override the two policies
#   DEVICE=mps ./chain.sh      # run on Apple GPU instead of cuda

# --- Python launcher (same interpreter used by infer.sh) --------------------
PY="${PY:-/Library/Frameworks/Python.framework/Versions/3.12/bin/python3.12}"

# --- Server / network -------------------------------------------------------
SERVER_ADDRESS="${SERVER_ADDRESS:-127.0.0.1:8080}"
API_PORT="${API_PORT:-8000}"
HOST="${SERVER_ADDRESS%%:*}"
PORT="${SERVER_ADDRESS##*:}"
DEVICE="${DEVICE:-cuda}"

# --- The two ACT policies to chain (order = grab-all then clean0) ------------
POLICY_A="${POLICY_A:-yiyanglu/hkhack-act-grab-all}"
POLICY_B="${POLICY_B:-yiyanglu/hkhack-act-clean0}"

# --- Robot config (bimanual SEEED B601 DM follower, from infer.sh) ----------
ROBOT_ARGS=(
    --robot.type=bi_seeed_b601_dm_follower
    --robot.id=rabea_bi_follower
    --robot.left_arm_config.port=/dev/tty.usbmodem5
    --robot.right_arm_config.port=/dev/tty.usbmodem00000000050C1
    --robot.right_arm_config.gripper_auto_home=true
    --robot.right_arm_config.gripper_home_velocity=1.5
    --robot.right_arm_config.gripper_home_torque_threshold=1.0
    --robot.right_arm_config.gripper_home_timeout_s=4.0
    --robot.cameras="{ left: {type: opencv, index_or_path: 1, width: 640, height: 480, fps: 30, rotation: 180},right: {type: opencv, index_or_path: 0, width: 640, height: 480, fps: 30, rotation: 180}, top: {type: opencv, index_or_path: 2, width: 1344, height: 376, fps: 30, stereo_half: left}}"
)

SERVER_PID=""
cleanup() {
    if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
        echo ">> Stopping policy server (pid ${SERVER_PID})"
        kill "${SERVER_PID}" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

# --- 1) Start the policy server if its control plane isn't already up --------
if ! curl -sf "http://${HOST}:${API_PORT}/status" >/dev/null 2>&1; then
    echo ">> Starting policy server: gRPC ${HOST}:${PORT}, control plane :${API_PORT}"
    "${PY}" -m lerobot.async_inference.policy_server \
        --host="${HOST}" \
        --port="${PORT}" \
        --api_port="${API_PORT}" \
        --fps=30 &
    SERVER_PID=$!

    echo -n ">> Waiting for control plane"
    for _ in $(seq 1 120); do
        if curl -sf "http://${HOST}:${API_PORT}/status" >/dev/null 2>&1; then
            echo " — up."
            break
        fi
        echo -n "."
        sleep 1
    done
else
    echo ">> Reusing policy server already listening on :${API_PORT}"
fi

# --- 2) Start the client: loads policy #1 now, lazy-loads #2 on first 's' ----
echo ">> Chaining: 1) ${POLICY_A} (active)  ->  2) ${POLICY_B} (loads on first 's')"
"${PY}" -m lerobot.async_inference.robot_client \
    "${ROBOT_ARGS[@]}" \
    --task="grab" \
    --server_address="${SERVER_ADDRESS}" \
    --api_port="${API_PORT}" \
    --policy_type=act \
    --pretrained_name_or_path="${POLICY_A}" \
    --chain="${POLICY_B}" \
    --switch_key=s \
    --policy_device="${DEVICE}" \
    --actions_per_chunk=50 \
    --chunk_size_threshold=0.5 \
    --fps=30 \
    --aggregate_fn_name=weighted_average
