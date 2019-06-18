import { uuid } from '@devexperts/utils/dist/string';

export type TaskValue = {
	id: string;
	title: string;
	completed: boolean;
	editing: boolean;
};
export const createTaskValue = (title: string, completed: boolean, editing: boolean): TaskValue => ({
	title,
	completed,
	editing,
	id: uuid(),
});

export const setCompleted = (completed: boolean) => (task: TaskValue): TaskValue => ({ ...task, completed });
export const setEditing = (editing: boolean) => (task: TaskValue): TaskValue => ({ ...task, editing });
export const setTitle = (title: string) => (task: TaskValue): TaskValue => ({ ...task, title });
