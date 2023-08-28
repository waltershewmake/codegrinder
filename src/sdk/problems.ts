import * as fs from "fs";
import { httpClient } from "./httpClient";

export interface Problem {
	id: number;
	unique: string;
	note: string;
	tags: string[];
	options: string[];
	createdAt: string;
	updatedAt: string;
}

export interface ProblemSet {
	id: number;
	unique: string;
	note: string;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ProblemSetProblem {
	problemSetID: number;
	problemID: number;
	weight: number;
}

export interface ReportCardResult {
	name: string;
	outcome: string;
	details: string;
	context: string;
}

export interface ReportCard {
	passed: boolean;
	note: string;
	duration: string;
	results?: ReportCardResult[];
}

export interface EventMessage {
	time: string;
	event: string;
	execCommand?: string[];
	exitStatus?: number;
	streamData?: string;
	error?: string;
	reportCard?: ReportCard;
	files?: Record<string, string>;
}

export interface Commit {
	id: number;
	assignmentID: number;
	problemID: number;
	step: number;
	action: string;
	note: string;
	files: Record<string, string> | null;
	transcript: EventMessage[] | null;
	reportCard: ReportCard | null;
	score: number;
	createdAt: string;
	updatedAt: string;
}

export interface Info {
	id: number;
	step: number;
}

export interface ProblemStep {
	problemID: number;
	step: number;
	problemType: string;
	note: string;
	instructions: string;
	weight: number;
	files: Record<string, string>;
	whitelist: Record<string, boolean>;
	solution?: Record<string, string>;
}

export interface ProblemTypeAction {
	problemType: string;
	action: string;
	command: string;
	parser: string;
	message: string;
	interactive: boolean;
	maxCPU: number;
	maxSession: number;
	maxTimeout: number;
	maxFD: number;
	maxFileSize: number;
	maxMemory: number;
	maxThreads: number;
}

export interface ProblemType {
	name: string;
	image: string;
	files: Record<string, string>;
	actions: Record<string, ProblemTypeAction>;
}

export interface DotFile {
	assignmentID: number;
	problems: Record<string, Info>;
	path?: string;
}

export async function getProblemSet(
	problemSetId: number,
	required: boolean = false
): Promise<ProblemSet> {
	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/problem_sets/${problemSetId}`
			)
		)?.data ?? null
	);
}

export async function getProblemSetProblems(
	problemSetID: number,
	required: boolean = false
): Promise<ProblemSetProblem[]> {
	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/problem_sets/${problemSetID}/problems`
			)
		)?.data ?? null
	);
}

export async function getProblem(
	problemId: number,
	required: boolean = false
): Promise<Problem> {
	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/problems/${problemId}`
			)
		)?.data ?? null
	);
}

export async function getCommit(
	assignmnetId: number,
	problemId: number,
	required: boolean = false
): Promise<Commit> {
	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/assignments/${assignmnetId}/problems/${problemId}/commits/last`
			)
		)?.data ?? null
	);
}

export async function getStep(
	problemId: number,
	step: number,
	required: boolean = false
): Promise<ProblemStep> {
	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/problems/${problemId}/steps/${step}`
			)
		)?.data ?? null
	);
}

export async function getProblemType(
	problemType: string,
	required: boolean = false
): Promise<ProblemType> {
	return (
		(
			await httpClient[required ? "mustGet" : "get"](
				`/problem_types/${problemType}`
			)
		)?.data ?? null
	);
}

export async function saveDotFile(dotFile: DotFile) {
	const { path, ...rest } = dotFile;
	if (path) {
		fs.writeFileSync(path, JSON.stringify(rest, null, 4) + "\n");
	}
}
