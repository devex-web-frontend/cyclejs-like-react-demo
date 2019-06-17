import { Location } from 'history';
import { ask } from 'fp-ts/lib/Reader';
import { TaskList } from '../components/task-list/task-list.component';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { Omit } from 'typelevel-ts';
import { createHandler, First, ReaderValueType, K } from '../../../utils/utils';
import { tasksService } from '../../../services/tasks.service';
import { Tasks } from '../model/tasks.model';
import { identity } from 'fp-ts/lib/function';
import { Source } from 'callbag';
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import tap from 'callbag-tap';

type TaskListContainerContext = {
	location: Source<Location>;
};

type Props = Omit<First<Parameters<ReaderValueType<typeof TaskList>>>, 'location' | 'tasks'>;

export const TaskListContainer = combineReader(
	TaskList,
	tasksService,
	ask<TaskListContainerContext>(),
	(TaskList, tasksService, { location }) => (props: Props) => {
		const local = createHandler<Tasks>();
		const tasks = K(merge(tasksService.data, local.source), identity);

		const { vdom, value } = TaskList({
			...props,
			location,
			tasks,
		});

		const effect = pipe(
			value,
			tap(value => {
				tasksService.save(value);
				local(value);
			}),
		);

		return {
			vdom,
			effect,
		};
	},
);
