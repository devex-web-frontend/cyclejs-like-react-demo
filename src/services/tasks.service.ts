import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { ask } from 'fp-ts/lib/Reader';
import { array, boolean, string, type, TypeOf } from 'io-ts';
import { JSONFromString } from '../utils/utils';

type TasksServiceContext = {
	storage: Storage;
};

const task = type({
	editing: boolean,
	completed: boolean,
	title: string,
});
const tasks = array(task);
const STORAGE_KEY = 'STORAGE_KEY';

const codec = string.pipe(JSONFromString).pipe(tasks);

export const tasksService = combineReader(ask<TasksServiceContext>(), ({ storage }) => {
	const load = () => codec.decode(storage.getItem(STORAGE_KEY)).getOrElse([]);
	const save = (value: TypeOf<typeof codec>) => storage.setItem(STORAGE_KEY, string.pipe(codec).encode(value));
	return {
		load,
		save,
	};
});
