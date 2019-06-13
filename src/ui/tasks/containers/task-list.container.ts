import { Location } from 'history';
import { ask } from 'fp-ts/lib/Reader';
import { TaskList } from '../components/task-list/task-list.component';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { Omit } from 'typelevel-ts';
import { createValue, First, ReaderValueType } from '../../../utils/utils';
import { Stream } from 'xstream';
import { Tasks } from '../model/tasks.model';

type TaskListContainerContext = {
	location: Stream<Location>;
};

type Props = Omit<First<Parameters<ReaderValueType<typeof TaskList>>>, 'location' | 'tasks'>;

const TASKS: Tasks = [
	{
		completed: false,
		editing: false,
		title: 'foo',
	},
	{
		completed: false,
		editing: false,
		title: 'bla',
	},
];

export const TaskListContainer = combineReader(
	TaskList,
	ask<TaskListContainerContext>(),
	(TaskList, { location }) => (props: Props) => {
		const [setTasks, tasks] = createValue(TASKS);
		const { vdom, value } = TaskList({
			...props,
			location,
			tasks,
		});
		const effect = value.map(setTasks);
		return {
			vdom,
			effect,
		};
	},
);
