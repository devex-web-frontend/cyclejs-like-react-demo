import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { ask } from 'fp-ts/lib/Reader';
import { array, boolean, string, type, TypeOf } from 'io-ts';
import { filterMap, JSONFromString } from '../utils/utils';
import { MemoryStream } from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import { fromEither } from 'fp-ts/lib/Option';

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

const event = fromEvent<StorageEvent>(window, 'storage')
	.filter(e => e.key === STORAGE_KEY)
	.compose(filterMap(e => fromEither(codec.decode(e.newValue))));

export const tasksService = combineReader(ask<TasksServiceContext>(), ({ storage }) => {
	const load = (): MemoryStream<TypeOf<typeof codec>> =>
		event.startWith(codec.decode(storage.getItem(STORAGE_KEY)).getOrElse([])).remember();
	const save = (value: TypeOf<typeof codec>) => storage.setItem(STORAGE_KEY, string.pipe(codec).encode(value));
	return {
		load,
		save,
	};
});
