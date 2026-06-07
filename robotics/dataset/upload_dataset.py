#!/usr/bin/env python
"""Upload the aggregated hkhack-grab-all dataset to the Hugging Face Hub."""

from pathlib import Path

from lerobot.datasets.lerobot_dataset import LeRobotDataset

CACHE = Path.home() / ".cache/huggingface/lerobot/yiyanglu"
repo_id = "yiyanglu/hkhack-grab-all"
root = CACHE / "hkhack-grab-all"

ds = LeRobotDataset(repo_id, root=root)
ds.push_to_hub(
    tags=["lerobot", "robotics"],
    private=False,
)
print("DONE uploading", repo_id)
