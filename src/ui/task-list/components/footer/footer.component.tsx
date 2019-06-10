import * as React from 'react';
import { createHandler, K, reduce, Streamify } from '../../../../utils';
import { MouseEvent } from 'react';
import { TaskValue } from '../../../task/components/task/task.component';

type Props = {
	tasks: TaskValue[];
};

export const Footer = (props: Streamify<Props>) => {
	const active = K(props.tasks, tasks => tasks.filter(task => !task.completed).length);
	const completed = K(props.tasks, tasks => tasks.filter(task => task.completed).length);

	const [handleClearCompletedClick, clearCompletedEvent] = createHandler<MouseEvent<HTMLButtonElement>>();

	const vdom = K(active, completed, (active, completed) => (
		<footer className="footer">
			<span className="todo-count">
				<strong>{active}</strong> item left
			</span>
			<ul className="filters">
				<li>
					<a className="selected" href="#/">
						All
					</a>
				</li>
				<li>
					<a href="#/active">Active</a>
				</li>
				<li>
					<a href="#/completed">Completed</a>
				</li>
			</ul>
			{completed > 0 && (
				<button className="clear-completed" onClick={handleClearCompletedClick}>
					Clear completed
				</button>
			)}
		</footer>
	));

	const value = reduce(props.tasks, clearCompletedEvent.mapTo(tasks => tasks.filter(s => !s.completed)));

	return {
		vdom,
		value,
	};
};
