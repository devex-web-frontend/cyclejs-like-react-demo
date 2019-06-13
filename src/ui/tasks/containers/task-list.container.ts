import { Location } from 'history';
import { ask } from 'fp-ts/lib/Reader';
import { TaskList } from '../components/task-list/task-list.component';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { Omit } from 'typelevel-ts';
import { First, ReaderValueType } from '../../../utils/utils';
import { Stream } from 'xstream';

type TaskListContainerContext = {
	location: Stream<Location>;
};

type Props = Omit<First<Parameters<ReaderValueType<typeof TaskList>>>, 'location'>;

export const TaskListContainer = combineReader(
	TaskList,
	ask<TaskListContainerContext>(),
	(TaskList, { location }) => (props: Props) =>
		TaskList({
			...props,
			location,
		}),
);
