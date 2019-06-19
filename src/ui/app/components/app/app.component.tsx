import { memo, ReactElement, useEffect, useMemo, useState, ComponentType } from 'react';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { TaskListContainer } from '../../../tasks/containers/task-list.container';
import merge from 'callbag-merge';
import map from 'callbag-map';
import pipe from 'callbag-pipe';
import { run } from '../../../../utils/utils';

export const App = combineReader(
	TaskListContainer,
	(TaskListContainer): ComponentType =>
		memo(() => {
			const [state, setState] = useState<ReactElement>();
			const taskListContainer = useMemo(() => TaskListContainer({}), [TaskListContainer]);
			useEffect(
				() =>
					run(
						merge(
							pipe(
								taskListContainer.vdom,
								map(dom => {
									console.log('setting state', dom);
									return setState(dom);
								}),
							),
							taskListContainer.effect,
						),
					),
				[taskListContainer.vdom, taskListContainer.effect],
			);
			console.log('rendering', state);
			return state || null;
		}),
);
