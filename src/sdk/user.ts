import { httpClient } from "./httpClient";

export interface User {
	id: number;
	name: string;
	email: string;
	ltiID: string;
	imageURL: string;
	canvasLogin: string;
	canvasID: number;
	author: boolean;
	admin: boolean;
	createdAt: Date;
	updatedAt: Date;
	lastSignedInAt: Date;
}

export async function getUser(required: boolean = false): Promise<User> {
	return (
		(await httpClient[required ? "mustGet" : "get"]("/users/me"))?.data ??
		null
	);
}
