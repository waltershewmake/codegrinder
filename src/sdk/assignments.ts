import path = require("path");
import * as fs from "fs";
import * as sdk from "./";
import { httpClient } from "./httpClient";
import {
	Commit,
	DotFile,
	Info,
	Problem,
	ProblemStep,
	ProblemType,
	getCommit,
	getProblem,
	getProblemSet,
	getProblemSetProblems,
	getProblemType,
	getStep,
	saveDotFile,
} from "./problems";
import { courseDirectory, decode64, from_slash, updateFiles } from "./utils";

export interface Assignment {
	id: number;
	courseID: number;
	problemSetID: number;
	userID: number;
	roles: string;
	instructor: boolean;
	rawScores: Record<string, number[]>;
	score: number;
	canvasTitle: string;
	canvasID: number;
	consumerKey: string;
	unlockAt?: Date;
	dueAt?: Date;
	lockAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export async function listAssignments(
	required: boolean = false
): Promise<Assignment[]> {
	let userId = (await sdk.getUser()).id;

	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/users/${userId}/assignments`
			)
		)?.data ?? null
	);
}

export async function getCourseUserAssignments(
	courseId: number,
	required: boolean = false
): Promise<Assignment[]> {
	let userId = (await sdk.getUser()).id;

	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/courses/${courseId}/users/${userId}/assignments`
			)
		)?.data ?? null
	);
}

export async function downloadAssignment(
	assignment: Assignment,
	course: sdk.Course,
	rootDir: string
): Promise<string | null> {
	const problemSet = await getProblemSet(assignment.problemSetID, true);

	rootDir = path.join(
		rootDir,
		courseDirectory(course.label),
		assignment.canvasTitle
	);

	// check if path exists. If it does, return root dir
	if (fs.existsSync(rootDir)) {
		return rootDir;
	}

	const problemSetProblems = await getProblemSetProblems(
		assignment.problemSetID,
		true
	);

	const commits: Record<string, Commit> = {};
	const infos: Record<string, Info> = {};
	const problems: Record<string, Problem> = {};
	const steps: Record<string, ProblemStep> = {};
	const types: Record<string, ProblemType> = {};

	for (const problemSetProblem of problemSetProblems) {
		const problem = await getProblem(problemSetProblem.problemID, true);
		problems[problem.unique] = problem;

		let commit = await getCommit(assignment.id, problem.id);

		let info: Info;
		if (!!commit) {
			info = {
				id: problem.id,
				step: commit.step,
			};
		} else {
			// if there is no commit for this problem we're starting from step 1
			info = {
				id: problem.id,
				step: 1,
			};
		}

		const step = await getStep(problem.id, 1, true);
		infos[problem.unique] = info;
		commits[problem.unique] = commit;
		steps[problem.unique] = step;

		if (!(step.problemType in types)) {
			const problemType = await getProblemType(step.problemType, true);
			types[step.problemType] = problemType;
		}

		for (const stepKey of Object.keys(steps)) {
			const commit = commits[stepKey];
			const info = infos[stepKey];
			const problem = problems[stepKey];
			const step = steps[stepKey];

			// in the old code, this was an if statement
			// if there was only one problem, it wouldnt create the unique dir
			// but I don't like that behavior
			const target = path.join(rootDir, problem.unique);

			let files: Record<string, Buffer> = Object.fromEntries(
				Object.entries(step.files).map(([name, contents]) => {
					return [from_slash(name), Buffer.from(contents, "base64")];
				})
			);

			if (!!commit && !!commit.files) {
				for (const [name, contents] of Object.entries(commit.files)) {
					files[from_slash(name)] = Buffer.from(contents, "base64");
				}
			}

			// save any problem type files
			for (const [name, contents] of Object.entries(
				types[step.problemType].files
			)) {
				files[from_slash(name)] = Buffer.from(contents, "base64");
			}

			updateFiles(target, files, {});

			if (!!commit && commit.reportCard?.passed && commit.score == 1.0) {
				await nextStep(target, info, problem, commit, types, null);
			}
		}
	}

	const dotFile: DotFile = {
		assignmentID: assignment.id,
		problems: infos,
		path: path.join(rootDir, problemSet.unique, ".grind"),
	};
	saveDotFile(dotFile);

	// return path.join(rootDir, courseDirectory(course.label));
	return rootDir;
}

export async function nextStep(
	directory: string,
	info: Info,
	problem: Problem,
	commit: Commit,
	types: Record<string, ProblemType>,
	newStep: ProblemStep | null
) {
	if (newStep === null) {
		newStep = await getStep(problem.id, info.step + 1, false);
		if (newStep === null) {
			return false;
		}
	}

	const oldStep = await getStep(problem.id, info.step, true);

	if (!types.hasOwnProperty(oldStep.problemType)) {
		const oldType = await getProblemType(oldStep.problemType, true);
		if (oldType === null) {
			return false;
		}
		types[oldStep.problemType] = oldType;
	}

	if (!types.hasOwnProperty(newStep.problemType)) {
		const newType = await getProblemType(newStep.problemType, true);
		if (newType === null) {
			return false;
		}
		types[newStep.problemType] = newType;
	}

	const files: Record<string, Buffer> = {};
	if (commit.files) {
		for (const [name, contents] of Object.entries(commit.files)) {
			files[from_slash(name)] = decode64(contents);
		}
	}

	for (const [name, contents] of Object.entries(newStep.files)) {
		files[from_slash(name)] = decode64(contents);
	}

	for (const [name, contents] of Object.entries(
		types[newStep.problemType].files
	)) {
		files[from_slash(name)] = decode64(contents);
	}

	const oldFiles: Record<string, boolean> = {};
	for (const name of Object.keys(types[oldStep.problemType].files)) {
		oldFiles[from_slash(name)] = true;
	}
	for (const name of Object.keys(oldStep.files)) {
		oldFiles[from_slash(name)] = true;
	}

	updateFiles(directory, files, oldFiles);

	info.step += 1;
	return true;
}
