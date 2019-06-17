import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { ask } from 'fp-ts/lib/Reader';
import { array, boolean, string, type, TypeOf } from 'io-ts';
import { filterMap, JSONFromString } from '../utils/utils';
import { fromEither } from 'fp-ts/lib/Option';
import { Source } from 'callbag';
import fromEvent from 'callbag-from-event';
import pipe from 'callbag-pipe';
import filter from 'callbag-filter';
import startWith from 'callbag-start-with';
import remember from 'callbag-remember';

type TasksServiceContext = {
	storage: Storage;
	window: Window;
};

type TasksService = {
	data: Source<Data>;
	save(value: Data): void;
};

const task = type({
	editing: boolean,
	completed: boolean,
	title: string,
});
const tasks = array(task);
const STORAGE_KEY = 'STORAGE_KEY';

const codec = string.pipe(JSONFromString).pipe(tasks);

type Data = TypeOf<typeof codec>;

export const tasksService = combineReader(
	ask<TasksServiceContext>(),
	({ storage, window }): TasksService => {
		const event = pipe(
			fromEvent(window, 'storage' as any),
			filter(e => e.key === STORAGE_KEY),
			filterMap(e => fromEither(codec.decode(e.newValue))),
		);

		return {
			data: pipe(
				event,
				startWith(codec.decode(storage.getItem(STORAGE_KEY)).getOrElse([])),
				remember,
			),
			save: data => storage.setItem(STORAGE_KEY, codec.encode(data)),
		};
	},
);
