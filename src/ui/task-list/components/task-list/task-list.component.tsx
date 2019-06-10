import { createValue, K } from '../../../../utils';

import 'todomvc-common/base.css';
import 'todomvc-app-css/index.css';
import * as React from 'react';
import { Header } from '../header/header.component';
import { Main } from '../main/main.component';
import { Footer } from '../footer/footer.component';
import { TaskValue } from '../../../task/components/task/task.component';
import xs from 'xstream';

const TASKS: TaskValue[] = [
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

export const TaskList = () => {
	const [setTasks, tasks] = createValue(TASKS);

	const header = Header({ tasks });

	const main = Main({ tasks });
	const footer = Footer({ tasks });
	const vdom = K(header.vdom, main.vdom, footer.vdom, (header, main, footer) => (
		<div>
			{header}
			{main}
			{footer}
		</div>
	));

	const tasksEffect = xs.merge(main.value, header.value, footer.value).map(setTasks);

	const effect = xs.merge(tasksEffect);

	return {
		vdom,
		effect,
	};
};
