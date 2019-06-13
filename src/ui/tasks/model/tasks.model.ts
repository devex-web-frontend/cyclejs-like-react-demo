import { Lens } from 'monocle-ts';

export type TaskValue = {
	title: string;
	completed: boolean;
	editing: boolean;
};

export const completedLens = Lens.fromProp<TaskValue>()('completed');
export const editingLens = Lens.fromProp<TaskValue>()('editing');
export const titleLens = Lens.fromProp<TaskValue>()('title');

export type Tasks = TaskValue[];
