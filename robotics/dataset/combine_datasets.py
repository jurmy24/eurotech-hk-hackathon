#!/usr/bin/env python
"""Combine hkhack-grab-0 and hkhack-grab-1 into hkhack-grab-all (LeRobot v3.0)."""

import logging
import shutil
from pathlib import Path

from lerobot.datasets.aggregate import aggregate_datasets

logging.basicConfig(level=logging.INFO)

CACHE = Path.home() / ".cache/huggingface/lerobot/yiyanglu"

names = ["hkhack-grab-0", "hkhack-grab-1"]
repo_ids = [f"yiyanglu/{n}" for n in names]
roots = [CACHE / n for n in names]

aggr_repo_id = "yiyanglu/hkhack-grab-all"
aggr_root = CACHE / "hkhack-grab-all"

if aggr_root.exists():
    print("Removing existing", aggr_root)
    shutil.rmtree(aggr_root)

aggregate_datasets(
    repo_ids=repo_ids,
    aggr_repo_id=aggr_repo_id,
    roots=roots,
    aggr_root=aggr_root,
)

print("DONE aggregating into", aggr_root)
