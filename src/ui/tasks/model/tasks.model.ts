import { unsafeDeleteAt, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { TaskValue } from './task.model';

export type Tasks = TaskValue[];
export const deleteAt = (index: number) => (tasks: Tasks): Tasks => unsafeDeleteAt(index, tasks);
export const updateAt = (index: number, value: TaskValue) => (tasks: Tasks) => unsafeUpdateAt(index, value, tasks);
