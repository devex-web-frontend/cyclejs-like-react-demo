import { Component, createValue, Empty, K, pipe } from '../../../../utils';
import { map, mergeArray } from '@most/core';

import 'todomvc-common/base.css';
import 'todomvc-app-css/index.css';
import * as React from 'react';
import { Header } from '../header/header.component';
import { Main } from '../main/main.component';
import { Footer } from '../footer/footer.component';
import { TaskValue } from '../../../task/components/task/task.component';

type Sink = {
	effect: void;
};

const tasks: TaskValue[] = [
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
	const [setTasks, tasksValue] = createValue(tasks);

	const header = Header();

	const main = Main({
		tasks: tasksValue,
	});
	const footer = Footer();
	const vdom = K(header.vdom, main.vdom, footer.vdom, (header, main, footer) => (
		<div>
			{header}
			{main}
			{footer}
		</div>
	));

	const tasksEffect = pipe(
		main.value,
		map(setTasks),
	);

	const effect = mergeArray([tasksEffect]);

	return {
		vdom,
		effect,
	};
};
