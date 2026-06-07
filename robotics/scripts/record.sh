#!/usr/bin/env bash
set -e

# Usage: ./record.sh <name> <number> [task]
# Dataset id -> yiyanglu/hkhack-<name>-<number>
NAME="$1"
NUMBER="$2"

# Task description stored in the dataset (override via 3rd arg).
TASK="${3:-Pick up the object and place it in the target location.}"

# Set RESUME=true to continue appending to an existing dataset.
RESUME="${RESUME:-false}"

lerobot-record \
    --robot.type=bi_seeed_b601_dm_follower \
    --robot.id=rabea_bi_follower \
    --robot.right_arm_config.port=/dev/tty.usbmodem5 \
    --robot.left_arm_config.port=/dev/tty.usbmodem00000000050C1 \
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
    --dataset.num_episodes=50 \
    --dataset.push_to_hub=true \
    --resume="${RESUME}" \
    --dataset.single_task="${TASK}" \
    --dataset.repo_id="yiyanglu/hkhack-${NAME}-${NUMBER}"
