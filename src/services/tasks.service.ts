import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { ask } from 'fp-ts/lib/Reader';
import { array, boolean, string, type, TypeOf } from 'io-ts';
import { filterMap, JSONFromString } from '../utils/utils';
import { fromEither } from 'fp-ts/lib/Option';
import { Stream } from '@most/types';
import { pipe } from '../utils/pipe.utils';
import { filter, multicast, startWith } from '@most/core';
import { StorageEventSource } from '../utils/storage.utils';
import { hold } from '../utils/hold.utils';

type TasksServiceContext = {
	storage: Storage;
};

type TasksService = {
	data: Stream<Data>;
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

const event = pipe(
	new StorageEventSource(),
	filter(e => e.key === STORAGE_KEY),
	filterMap(e => fromEither(codec.decode(e.newValue))),
	multicast,
);

export const tasksService = combineReader(
	ask<TasksServiceContext>(),
	({ storage }): TasksService => {
		return {
			data: pipe(
				event,
				startWith(codec.decode(storage.getItem(STORAGE_KEY)).getOrElse([])),
				hold,
			),
			save: data => storage.setItem(STORAGE_KEY, codec.encode(data)),
		};
	},
);
