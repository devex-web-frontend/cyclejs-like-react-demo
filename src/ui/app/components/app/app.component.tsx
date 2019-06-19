import { memo, ReactElement, useEffect, useMemo, useState, ComponentType } from 'react';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { TaskListContainer } from '../../../tasks/containers/task-list.container';
import merge from 'callbag-merge';
import map from 'callbag-map';
import pipe from 'callbag-pipe';
import { constVoid } from 'fp-ts/lib/function';
import { END, START } from '../../../../utils/utils';

export const App = combineReader(
	TaskListContainer,
	(TaskListContainer): ComponentType =>
		memo(() => {
			const [state, setState] = useState<ReactElement>();
			const taskListContainer = useMemo(() => TaskListContainer({}), [TaskListContainer]);
			useEffect(() => {
				const sink = merge(
					pipe(
						taskListContainer.vdom,
						map(setState),
					),
					taskListContainer.effect,
				);
				sink(START, constVoid);
				return () => sink(END);
			}, [taskListContainer.vdom, taskListContainer.effect]);
			return state || null;
		}),
);
