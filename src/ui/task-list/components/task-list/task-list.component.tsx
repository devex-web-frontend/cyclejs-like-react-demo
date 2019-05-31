import { Component, createValue, Empty, K } from '../../../../utils';

import 'todomvc-common/base.css';
import 'todomvc-app-css/index.css';
import * as React from 'react';
import { Header } from '../header/header.component';
import { Main } from '../main/main.component';
import { Footer } from '../footer/footer.component';
import { TaskValue } from '../../../task/components/task/task.component';
import { map } from 'rxjs/operators';
import { merge } from 'rxjs';

type Sink = {
	effect: void;
};

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

export const TaskList: Component<Empty, Sink> = () => {
	const [setTasks, tasks] = createValue(TASKS);

	const header = Header({
		tasks,
	});

	const main = Main({
		tasks,
	});
	const footer = Footer();
	const vdom = K(header.vdom, main.vdom, footer.vdom, (header, main, footer) => (
		<div>
			{header}
			{main}
			{footer}
		</div>
	));

	const tasksEffect = merge(main.value, header.value).pipe(map(setTasks));

	const effect = merge(tasksEffect);

	return {
		vdom,
		effect,
	};
};
