import * as vscode from "vscode";
import { Event, EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import * as sdk from "./sdk";

class CourseTreeIem extends vscode.TreeItem {
	constructor(public readonly course: sdk.Course) {
		super(course.name, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = "course";
		this.course = course;
		this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
	}
}

class AssignmentTreeItem extends vscode.TreeItem {
	constructor(public readonly assignment: sdk.Assignment) {
		super(
			assignment.canvasTitle,
			vscode.TreeItemCollapsibleState.Collapsed
		);
		this.contextValue = "assignment";
		this.assignment = assignment;
		this.command = {
			command: "codegrinder.getAssignment",
			title: "Get Assignment",
			arguments: [this.assignment],
		};
	}
}

class SectionTreeItem extends vscode.TreeItem {
	constructor(
		public readonly course: string,
		public readonly assignment: string,
		public readonly label: string
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.contextValue = "section";
		this.command = {
			command: "codegrinder.openSection",
			title: "Open Section",
			arguments: [course, assignment, label],
		};
	}
}

export class AssignmentProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> =
		new EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined> =
		this._onDidChangeTreeData.event;
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		if (!element) {
			const courses = await sdk.getCourses(true);
			return courses.map((course) => new CourseTreeIem(course));
		} else if (element.contextValue === "course") {
			const { course } = element as CourseTreeIem;

			// Fetch assignments for the course and create AssignmentTreeItems
			const assignments = await sdk.getCourseUserAssignments(
				course.id,
				true
			);

			return assignments.map(
				(assignment) => new AssignmentTreeItem(assignment)
			);
		} else if (element.contextValue === "assignment") {
			const { assignment } = element as AssignmentTreeItem;

			const course = await sdk.getCourse(assignment.courseID, true);

			// Generate sections for the assignment and create SectionTreeItems
			const sections = Object.keys(assignment.rawScores).map(
				(section) =>
					new SectionTreeItem(
						course.label,
						assignment.canvasTitle,
						section
					)
			);

			return sections;
		}

		return [];
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}
}
