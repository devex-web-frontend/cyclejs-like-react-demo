import { uuid } from '@devexperts/utils/dist/string';

export type TaskValue = {
	title: string;
	completed: boolean;
	editing: boolean;
	id: string;
};

export const setCompleted = (completed: boolean) => (task: TaskValue): TaskValue => ({ ...task, completed });
export const setEditing = (editing: boolean) => (task: TaskValue): TaskValue => ({ ...task, editing });
export const setTitle = (title: string) => (task: TaskValue): TaskValue => ({ ...task, title });

export const createTaskValue = (title: string, completed: boolean, editing: boolean): TaskValue => ({
	id: uuid(),
	title,
	completed,
	editing,
});
