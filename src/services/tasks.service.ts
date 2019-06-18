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

type TasksService = {
	data: MemoryStream<Data>;
	save(value: Data): void;
};

const task = type({
	id: string,
	editing: boolean,
	completed: boolean,
	title: string,
});
const tasks = array(task);
const STORAGE_KEY = 'STORAGE_KEY';

const codec = string.pipe(JSONFromString).pipe(tasks);

type Data = TypeOf<typeof codec>;

const event = fromEvent<StorageEvent>(window, 'storage')
	.filter(e => e.key === STORAGE_KEY)
	.compose(filterMap(e => fromEither(codec.decode(e.newValue))));

export const tasksService = combineReader(
	ask<TasksServiceContext>(),
	({ storage }): TasksService => {
		return {
			data: event.startWith(codec.decode(storage.getItem(STORAGE_KEY)).getOrElse([])).remember(),
			save: data => storage.setItem(STORAGE_KEY, codec.encode(data)),
		};
	},
);
