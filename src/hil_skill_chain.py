"""Human-in-the-loop, manual-gated skill chain for the reBot B601-DM arm.

We run prompt-conditioned pi0.5 skills one at a time over LeRobot's
programmatic rollout API. The operator advances between skills:

    READY -> (Start) -> RUNNING -> (Done/Ctrl-C/timeout) -> READY_NEXT -> ... -> COMPLETE

Each skill builds a *fresh* rollout context (task = the skill prompt) so pi0.5
hidden state / RTC action chunks never leak from one prompt into the next. The
robot keeps moving while we wait for the operator: the rollout loop runs in the
main thread and we set the rollout's `shutdown_event` from an input thread when
the operator presses ENTER ("Done").

Run this on the robot host (needs `lerobot` + `lerobot_robot_seeed_b601`):

    python -m src.hil_skill_chain
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass

from lerobot.cameras.opencv import OpenCVCameraConfig
from lerobot.configs import PreTrainedConfig
from lerobot.rollout import BaseStrategyConfig, RolloutConfig, build_rollout_context
from lerobot.rollout.inference import RTCInferenceConfig, SyncInferenceConfig
from lerobot.rollout.strategies import BaseStrategy
from lerobot.utils.process import ProcessSignalHandler
from lerobot.utils.utils import init_logging

# reBot B601-DM follower (Damiao serial bridge). Registered type:
# `seeed_b601_dm_follower`. Native fork alternative: RebotB601FollowerConfig.
from lerobot_robot_seeed_b601 import SeeedB601DMFollowerConfig

# --- Edit these for your rig -------------------------------------------------
POLICY_PATH = "outputs/pi05_training/checkpoints/last/pretrained_model"
ROBOT_PORT = "/dev/ttyACM0"
ROBOT_ID = "follower1"
DEVICE = "cuda"
FPS = 30
USE_RTC = True  # pi0.5 is a large VLA; RTC hides inference latency.
MAX_SKILL_SECONDS = 60  # safety watchdog; 0 disables.

CAMERAS = {
    "front": OpenCVCameraConfig(index_or_path=0, width=640, height=480, fps=30),
    "side": OpenCVCameraConfig(index_or_path=2, width=640, height=480, fps=30),
}


@dataclass(frozen=True)
class Skill:
    name: str
    prompt: str


# Drain-cleaning demo. Prompts are placeholders — tune to your pi0.5 checkpoint.
SKILLS = [
    Skill("lift_cover", "Grab the hooks and lift the drain cover off the drain."),
    Skill("chop_debris", "Lower the chopper into the drain and chop the debris."),
    Skill("replace_cover", "Place the drain cover back onto the drain."),
]


class ManualSkillChain:
    """Runs an ordered list of prompts, gated by the operator between each."""

    def __init__(self, skills: list[Skill]):
        self.skills = skills
        # One handler for the whole session: Ctrl-C gracefully stops the
        # current skill (sets the event) instead of killing the process.
        self.signal_handler = ProcessSignalHandler(use_threads=True)

    def _make_config(self, prompt: str) -> RolloutConfig:
        robot = SeeedB601DMFollowerConfig(
            port=ROBOT_PORT,
            id=ROBOT_ID,
            can_adapter="damiao",
            cameras=CAMERAS,
        )
        policy = PreTrainedConfig.from_pretrained(POLICY_PATH)
        policy.pretrained_path = POLICY_PATH

        inference = RTCInferenceConfig() if USE_RTC else SyncInferenceConfig()
        return RolloutConfig(
            robot=robot,
            policy=policy,
            strategy=BaseStrategyConfig(),
            inference=inference,
            fps=FPS,
            duration=0,  # infinite; we stop manually via shutdown_event.
            task=prompt,
            device=DEVICE,
        )

    def run_skill(self, skill: Skill) -> None:
        """Run one skill until the operator presses ENTER, Ctrl-C, or timeout."""
        print(f"\n=== Running: {skill.name} ===\nPrompt: {skill.prompt}")

        stop = self.signal_handler.shutdown_event
        stop.clear()

        # "Done" gate: operator presses ENTER -> stop the rollout loop.
        threading.Thread(
            target=lambda: (
                input("Press ENTER when this skill is done...\n"),
                stop.set(),
            ),
            daemon=True,
        ).start()

        # Safety watchdog.
        if MAX_SKILL_SECONDS:
            deadline = time.monotonic() + MAX_SKILL_SECONDS

            def watchdog():
                while not stop.wait(0.2):
                    if time.monotonic() >= deadline:
                        print(
                            f"\n[safety] {skill.name} hit {MAX_SKILL_SECONDS}s limit."
                        )
                        stop.set()
                        return

            threading.Thread(target=watchdog, daemon=True).start()

        # Fresh context per skill => no stale pi0.5 / RTC state across prompts.
        cfg = self._make_config(skill.prompt)
        ctx = build_rollout_context(cfg, stop)
        strategy = BaseStrategy(cfg.strategy)
        try:
            strategy.setup(ctx)
            strategy.run(ctx)  # blocks until `stop` is set
        finally:
            strategy.teardown(ctx)
        print(f"Stopped: {skill.name}")

    def run_chain(self) -> None:
        i = 0
        while i < len(self.skills):
            skill = self.skills[i]
            choice = (
                input(
                    f"\nStep {i + 1}/{len(self.skills)}: {skill.name} "
                    "— [ENTER]=start, s=skip, q=quit: "
                )
                .strip()
                .lower()
            )
            if choice == "q":
                print("Aborted by operator.")
                return
            if choice == "s":
                i += 1
                continue

            self.run_skill(skill)

            after = (
                input("Skill done — [ENTER]=next, r=retry, q=quit: ").strip().lower()
            )
            if after == "q":
                print("Aborted by operator.")
                return
            if after != "r":
                i += 1

        print("\nSkill chain complete.")


def main() -> None:
    init_logging()
    ManualSkillChain(SKILLS).run_chain()


if __name__ == "__main__":
    main()
