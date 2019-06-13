import { Location } from 'history';
import { ask } from 'fp-ts/lib/Reader';
import { TaskList } from '../components/task-list/task-list.component';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { Omit } from 'typelevel-ts';
import { createHandler, First, ReaderValueType, tap } from '../../../utils/utils';
import xs, { Stream } from 'xstream';
import { tasksService } from '../../../services/tasks.service';
import { Tasks } from '../model/tasks.model';

type TaskListContainerContext = {
	location: Stream<Location>;
};

type Props = Omit<First<Parameters<ReaderValueType<typeof TaskList>>>, 'location' | 'tasks'>;

export const TaskListContainer = combineReader(
	TaskList,
	tasksService,
	ask<TaskListContainerContext>(),
	(TaskList, tasksService, { location }) => (props: Props) => {
		const local = createHandler<Tasks>();
		const tasks = xs.merge(tasksService.data, local).remember();

		const { vdom, value } = TaskList({
			...props,
			location,
			tasks,
		});

		const effect = value.compose(
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
