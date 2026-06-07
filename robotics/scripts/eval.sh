#!/usr/bin/env bash
set -e

# Usage: ./eval.sh [policy] [number] [task]
# Evaluates a trained policy by rolling it out on the robot and recording the
# rollouts. Eval dataset id -> yiyanglu/eval_<policy_short>-<number>
# (lerobot requires the dataset name to begin with 'eval_' when a policy is set)
#
# policy: HuggingFace model repo id of the policy to evaluate.
POLICY="${1:-yiyanglu/hkhack-act-grate0}"
NUMBER="${2:-0}"

# Task description stored in the dataset (override via 3rd arg).
TASK="${3:-Pick up the object and place it in the target location.}"

# Set RESUME=true to continue appending to an existing dataset.
RESUME="${RESUME:-false}"

# Derive a short, filesystem-friendly name from the policy id for the eval dataset.
POLICY_SHORT="$(basename "${POLICY}")"

lerobot-record \
    --robot.type=bi_seeed_b601_dm_follower \
    --robot.id=rabea_bi_follower \
    --robot.left_arm_config.port=/dev/tty.usbmodem5 \
    --robot.right_arm_config.port=/dev/tty.usbmodem00000000050C1 \
    --robot.right_arm_config.gripper_auto_home=true \
    --robot.right_arm_config.gripper_home_velocity=1.5 \
    --robot.right_arm_config.gripper_home_torque_threshold=1.0 \
    --robot.right_arm_config.gripper_home_timeout_s=4.0 \
    --robot.cameras="{ left: {type: opencv, index_or_path: 1, width: 640, height: 480, fps: 30, rotation: 180},right: {type: opencv, index_or_path: 0, width: 640, height: 480, fps: 30, rotation: 180}, top: {type: opencv, index_or_path: 2, width: 1344, height: 376, fps: 30, stereo_half: left}}" \
    --teleop.type=bi_rebot_arm_102_leader \
    --teleop.id=rabea_bi_leader \
    --teleop.right_arm_config.port=/dev/tty.usbserial-1130 \
    --teleop.left_arm_config.port=/dev/tty.usbserial-11410 \
    --display_data=true \
    --policy.path="${POLICY}" \
    --dataset.num_episodes=50 \
    --dataset.push_to_hub=true \
    --resume="${RESUME}" \
    --dataset.single_task="${TASK}" \
    --dataset.repo_id="yiyanglu/eval_${POLICY_SHORT}-${NUMBER}"


cd /workspace/policy-infra && .venv/bin/python -m lerobot.async_inference.robot_client \
    --robot.type=bi_seeed_b601_dm_follower \
    --robot.port=/dev/tty.usbmodem5 \
    --robot.id=rabea_bi_follower \
    --robot.left_arm_config.port=/dev/tty.usbmodem5 \
    --robot.right_arm_config.port=/dev/tty.usbmodem00000000050C1 \
    --robot.right_arm_config.gripper_auto_home=true \
    --robot.right_arm_config.gripper_home_velocity=1.5 \
    --robot.right_arm_config.gripper_home_torque_threshold=1.0 \
    --robot.right_arm_config.gripper_home_timeout_s=4.0 \
    --robot.cameras="{ left: {type: opencv, index_or_path: 1, width: 640, height: 480, fps: 30, rotation: 180},right: {type: opencv, index_or_path: 0, width: 640, height: 480, fps: 30, rotation: 180}, top: {type: opencv, index_or_path: 2, width: 1344, height: 376, fps: 30, stereo_half: left}}" \
    --robot.id=rabea_bi_follower \
    --robot.cameras="{ left: {type: opencv, index_or_path: 1, width: 640, height: 480, fps: 30, rotation: 180},right: {type: opencv, index_or_path: 0, width: 640, height: 480, fps: 30, rotation: 180}, top: {type: opencv, index_or_path: 2, width: 1344, height: 376, fps: 30, stereo_half: left}}" \
    --task="${TASK}" \
    --server_address=127.0.0.1:8080 \
    --api_port=8000 \
    --policy_type=pi05 \
    --policy_device=cuda \
    --actions_per_chunk=50 \
    --chunk_size_threshold=0.5 \
    --fps=30 \
    --aggregate_fn_name=weighted_average