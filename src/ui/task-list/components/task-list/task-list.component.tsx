import { createValue, K, Streamify } from '../../../../utils';

import 'todomvc-common/base.css';
import 'todomvc-app-css/index.css';
import * as React from 'react';
import { Header } from '../header/header.component';
import { Main } from '../main/main.component';
import { Footer } from '../footer/footer.component';
import { TaskValue } from '../../../task/components/task/task.component';
import xs, { Producer } from 'xstream';
import { History, Location } from 'history';

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

type Props = {
	location: Location;
};

export const TaskList = (props: Streamify<Props>) => {
	const [setTasks, local] = createValue(TASKS);

	const tasks = K(local, props.location, (tasks, location) => {
		switch (location.pathname) {
			case '/active': {
				return tasks.filter(task => !task.completed);
			}
			case '/completed': {
				return tasks.filter(task => task.completed);
			}
			default: {
				return tasks;
			}
		}
	}).remember();

	const header = Header({ tasks });

	const main = Main({ tasks });
	const footer = Footer({ tasks, location: props.location });
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
