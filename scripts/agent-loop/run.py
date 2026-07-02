import argparse
import shutil
import subprocess
import time
from pathlib import Path

import prompt_strings as prompts
import const as const



def has_open_issues():
	result = subprocess.run(
		["gh", "issue", "list", "--state", "open", "--limit", "1", "--json", "number", "-q", "length"],
		capture_output=True,
		text=True,
		check=True,
	)
	return result.stdout.strip() != "0"


def run_dev_agent(str_prompt: str, new_session = False):
	#if new_session == False, add the continue param to the CLI call
	new_session_param = "--continue" if new_session == False else "-p"	
	
	print("")
	print("--------------------------------")
	print(f"Running dev agent with prompt: {str_prompt}")
	print("--------------------------------")
	print("")
	subprocess.run(
		[
			"cursor-agent",
			"-p",
			"--yolo",
			new_session_param,
			"--workspace",
			str(const.REPO_ROOT),
			"--model",
			"auto",
			str_prompt,
		],
		cwd=const.REPO_ROOT,
		check=True,
	)


def run_lead_agent(str_prompt: str, new_session = False):
	new_session_param = "--continue" if new_session == False else "-p"	
	
	print("")
	print("--------------------------------")
	print(f"Running lead agent with prompt: {str_prompt}")
	print("--------------------------------")
	print("")
	subprocess.run(
		[
			"claude",
			"-p",
			"--dangerously-skip-permissions",
			new_session_param,
			"--model",
			"opus",
			str_prompt,
		],
		cwd=const.REPO_ROOT,
		check=True,
	)


def reset_loop_controls():
	if const.LOOP_CONTROLS.exists():
		shutil.rmtree(const.LOOP_CONTROLS)
	const.LOOP_CONTROLS.mkdir()


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("--solve-issue", type=int, metavar="NUMBER", default=None)
	args = parser.parse_args()

	if args.solve_issue is not None and args.solve_issue <= 0:
		print("Issue number must be a positive integer")
		exit(1)

	reset_loop_controls()
	if args.solve_issue is not None:
		const.SOLVE_ISSUE_FILE.write_text(str(args.solve_issue))

	run_dev_agent(prompts.DEV_NEW_SESSION_PROMPT, new_session=True)
	run_lead_agent(prompts.LEAD_NEW_SESSION_PROMPT, new_session=True)

    

	while True:

		

		if has_open_issues():

			solve_issue_number = (
				const.SOLVE_ISSUE_FILE.read_text().strip()
				if const.SOLVE_ISSUE_FILE.exists()
				else ""
			)

			STATE_MACHINE = "DEV_CHOOSING_ISSUE" if solve_issue_number == "" else "DEV_WORK_ON_ISSUE"

			match STATE_MACHINE:
				case "DEV_WORK_ON_ISSUE":
					print(f"working on issue {solve_issue_number}")
					run_dev_agent(prompts.DEV_WORK_ON_ISSUE_PROMPT.format(issue_number=solve_issue_number))
					STATE_MACHINE = "LEAD_PR_REVIEW_LATEST"

				case "DEV_CHOOSING_ISSUE":
					print("Choosing issue")
					run_dev_agent(prompts.DEV_CHOOSES_ISSUES_PROMPT)
					STATE_MACHINE = "LEAD_PR_REVIEW_LATEST"

				case "LEAD_PR_REVIEW_LATEST":
					print("Lead Reviewing latest PR")	
					run_lead_agent(prompts.LEAD_PR_REVIEW_LATEST)
					STATE_MACHINE = "LEAD_REVIEW_PR_COMPLETE"

				case "LEAD_REVIEW_PR_COMPLETE":
					print("Lead Reviewing PR complete")
					STATE_MACHINE = "MERGE_PR"


if __name__ == "__main__":
	main()
