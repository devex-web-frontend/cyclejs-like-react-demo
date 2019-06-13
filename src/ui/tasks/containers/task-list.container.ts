import { Location } from 'history';
import { ask } from 'fp-ts/lib/Reader';
import { TaskList } from '../components/task-list/task-list.component';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { Omit } from 'typelevel-ts';
import { createValue, First, ReaderValueType } from '../../../utils/utils';
import { Stream } from 'xstream';
import { tasksService } from '../../../services/tasks.service';

type TaskListContainerContext = {
	location: Stream<Location>;
};

type Props = Omit<First<Parameters<ReaderValueType<typeof TaskList>>>, 'location' | 'tasks'>;

export const TaskListContainer = combineReader(
	TaskList,
	tasksService,
	ask<TaskListContainerContext>(),
	(TaskList, tasksService, { location }) => (props: Props) => {
		const [setTasks, tasks] = createValue(tasksService.load());
		const { vdom, value } = TaskList({
			...props,
			location,
			tasks,
		});
		const effect = value.map(value => {
			setTasks(value);
			tasksService.save(value);
		});
		return {
			vdom,
			effect,
		};
	},
);
