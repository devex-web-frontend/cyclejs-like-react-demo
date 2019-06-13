import * as React from 'react';
import { createHandler, K, reduce, Streamify } from '../../../../utils';
import { MouseEvent } from 'react';
import { TaskValue } from '../../../task/components/task/task.component';
import { Location } from 'history';
import classNames from 'classnames';

type Props = {
	tasks: TaskValue[];
	location: Location;
};

const renderFilter = (path: string, currentPath: string, label: string) => {
	const className = classNames({
		selected: currentPath === path,
	});
	return (
		<a href={`#${path}`} className={className}>
			{label}
		</a>
	);
};

export const Footer = (props: Streamify<Props>) => {
	const active = K(props.tasks, tasks => tasks.filter(task => !task.completed).length);
	const completed = K(props.tasks, tasks => tasks.filter(task => task.completed).length);

	const handleClearCompletedClick = createHandler<MouseEvent<HTMLButtonElement>>();

	const pathname = K(props.location, location => location.pathname);

	const vdom = K(active, completed, pathname, (active, completed, pathname) => (
		<footer className="footer">
			<span className="todo-count">
				<strong>{active}</strong> item{active !== 1 ? 's' : ''} left
			</span>
			<ul className="filters">
				<li>{renderFilter('/', pathname, 'All')}</li>
				<li>{renderFilter('/active', pathname, 'Active')}</li>
				<li>{renderFilter('/completed', pathname, 'Completed')}</li>
			</ul>
			{completed > 0 && (
				<button className="clear-completed" onClick={handleClearCompletedClick}>
					Clear completed
				</button>
			)}
		</footer>
	));

	const value = reduce(props.tasks, handleClearCompletedClick.mapTo(tasks => tasks.filter(s => !s.completed)));

	return {
		vdom,
		value,
	};
};
