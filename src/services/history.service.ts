import { Stream } from '@most/types';
import { History, Location } from 'history';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { ask } from 'fp-ts/lib/Reader';
import { HistoryEventSource } from '../utils/history.utils';
import { pipe } from '../utils/pipe.utils';
import { hold } from '../utils/hold.utils';

export type HistoryService = {
	location: Stream<Location>;
};

export type HistoryServiceContext = {
	history: History;
};

export const historyService = combineReader(ask<HistoryServiceContext>(), ({ history }) => {
	return {
		location: pipe(
			new HistoryEventSource(history),
			hold,
		),
	};
});
