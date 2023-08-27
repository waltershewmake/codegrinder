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
	createdAt: string;
	updatedAt: string;
	lastSignedInAt: string;
}
