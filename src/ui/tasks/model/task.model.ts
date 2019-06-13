export type TaskValue = {
	title: string;
	completed: boolean;
	editing: boolean;
};

export const setCompleted = (completed: boolean) => (task: TaskValue): TaskValue => ({ ...task, completed });
export const setEditing = (editing: boolean) => (task: TaskValue): TaskValue => ({ ...task, editing });
export const setTitle = (title: string) => (task: TaskValue): TaskValue => ({ ...task, title });
