
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
LOOP_CONTROLS = SCRIPT_DIR / "loop_controls"
SOLVE_ISSUE_FILE = LOOP_CONTROLS / "solve_issue.txt"
CURRENT_PR_FILE = LOOP_CONTROLS / "current_pr.txt"
