import { httpClient } from "./httpClient";

export interface Course {
	id: number;
	name: string;
	label: string;
	ltiID: string;
	canvasID: number;
	createdAt: Date;
	updatedAt: Date;
}

export async function getCourses(required: boolean = false): Promise<Course[]> {
	return (
		(await httpClient[required ? "mustGet" : "get"]("/courses"))?.data ??
		null
	);
}

export async function getCourse(
	courseId: number,
	required: boolean = false
): Promise<Course> {
	return (
		(await httpClient[required ? "mustGet" : "get"](`/courses/${courseId}`))
			?.data ?? null
	);
}
